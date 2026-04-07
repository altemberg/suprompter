from http.server import BaseHTTPRequestHandler
import json
import os
import subprocess
import tempfile
import urllib.request

COBALT_URL = os.environ.get("COBALT_URL", "")


def get_audio_url_ytdlp(url: str) -> str:
    result = subprocess.run(
        [
            "yt-dlp",
            "--no-playlist",
            "--get-url",
            "-f", "bestaudio/best",
            "--no-warnings",
            "--no-check-certificate",
            url,
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0 or not result.stdout.strip():
        raise Exception(f"yt-dlp: {result.stderr.strip() or 'sem saída'}")
    return result.stdout.strip().split("\n")[0]


def get_audio_url_cobalt(url: str) -> str:
    if not COBALT_URL:
        raise Exception("COBALT_URL não configurado")

    payload = json.dumps({
        "url": url,
        "downloadMode": "audio",
        "audioFormat": "mp3",
    }).encode()

    req = urllib.request.Request(
        f"{COBALT_URL.rstrip('/')}/",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())

    if data.get("status") not in ("tunnel", "redirect", "stream"):
        raise Exception(f"Cobalt status inesperado: {data.get('status')} — {data.get('error', {}).get('code', '')}")

    audio_url = data.get("url", "")
    if not audio_url:
        raise Exception("Cobalt não retornou URL de download")
    return audio_url


def transcribe_with_whisper(audio_url: str, api_key: str) -> dict:
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        urllib.request.urlretrieve(audio_url, tmp_path)

        with open(tmp_path, "rb") as audio_file:
            audio_data = audio_file.read()

        boundary = "----WFBoundary7MA4YWxkTrZu0gW"

        def field(name: str, value: str) -> bytes:
            return (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
                f"{value}\r\n"
            ).encode()

        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="audio.mp3"\r\n'
            f"Content-Type: audio/mpeg\r\n\r\n"
        ).encode()
        body += audio_data
        body += b"\r\n"
        body += field("model", "openai/whisper-1")
        body += field("language", "pt")
        body += field("response_format", "verbose_json")
        body += field("timestamp_granularities[]", "segment")
        body += f"--{boundary}--\r\n".encode()

        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/audio/transcriptions",
            data=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "HTTP-Referer": "https://suprompter.vercel.app",
                "X-Title": "Suprompter",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read())
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length))
            url = body.get("url", "").strip()
            api_key = body.get("apiKey", "").strip()

            if not url:
                self._respond(400, {"error": "URL não fornecida"})
                return
            if not api_key:
                self._respond(400, {"error": "API key não fornecida"})
                return

            # Tenta yt-dlp primeiro
            audio_url = None
            source = None
            ytdlp_err = None
            cobalt_err = None

            try:
                audio_url = get_audio_url_ytdlp(url)
                source = "ytdlp"
            except Exception as e:
                ytdlp_err = str(e)
                print(f"[yt-dlp] falhou: {e}")

            # Fallback para Cobalt
            if not audio_url:
                try:
                    audio_url = get_audio_url_cobalt(url)
                    source = "cobalt"
                except Exception as e:
                    cobalt_err = str(e)
                    print(f"[cobalt] falhou: {e}")

            if not audio_url:
                self._respond(422, {
                    "error": (
                        "Não foi possível extrair o áudio desta URL. "
                        "Verifique se o link é público. "
                        f"(yt-dlp: {ytdlp_err} | cobalt: {cobalt_err})"
                    )
                })
                return

            result = transcribe_with_whisper(audio_url, api_key)

            self._respond(200, {
                "text": result.get("text", ""),
                "language": result.get("language"),
                "duration": result.get("duration"),
                "segments": [
                    {
                        "start": s.get("start"),
                        "end": s.get("end"),
                        "text": s.get("text", "").strip(),
                    }
                    for s in result.get("segments", [])
                ],
                "source": source,
            })

        except Exception as e:
            print(f"[transcribe] erro geral: {e}")
            self._respond(500, {"error": str(e)})

    def _respond(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        pass
