from http.server import BaseHTTPRequestHandler
import json
import os
import tempfile
import urllib.request

COBALT_URL = os.environ.get("COBALT_URL", "")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")


def get_audio_url_ytdlp(url: str) -> str:
    """Extrai URL do áudio via yt-dlp como módulo Python."""
    import yt_dlp

    result_url = []

    ydl_opts = {
        "format": "bestaudio/best",
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "extract_flat": False,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        if not info:
            raise Exception("Não foi possível extrair informações do vídeo")

        if "url" in info:
            result_url.append(info["url"])
        elif "formats" in info:
            audio_formats = [
                f for f in info["formats"]
                if f.get("acodec") != "none" and f.get("url")
            ]
            if not audio_formats:
                raise Exception("Nenhum formato de áudio encontrado")
            audio_only = [f for f in audio_formats if f.get("vcodec") == "none"]
            best = audio_only[-1] if audio_only else audio_formats[-1]
            result_url.append(best["url"])

    if not result_url:
        raise Exception("URL de áudio não encontrada")

    return result_url[0]


def get_audio_url_cobalt(url: str) -> str:
    """Fallback: extrai URL do áudio via Cobalt no Railway."""
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

    status = data.get("status")
    if status not in ("tunnel", "redirect", "stream", "picker"):
        raise Exception(f"Cobalt status inesperado: {status} — {data}")

    audio_url = data.get("url")
    if not audio_url and status == "picker":
        picker = data.get("picker", [])
        if picker:
            audio_url = picker[0].get("url")

    if not audio_url:
        raise Exception("Cobalt não retornou URL de áudio")

    return audio_url


def download_audio(audio_url: str, original_url: str = "") -> str:
    """Baixa o áudio via yt-dlp para que ele gerencie headers/cookies por plataforma."""
    import yt_dlp
    import glob

    suffix = ".mp3"
    if ".m4a" in audio_url:
        suffix = ".m4a"
    elif ".webm" in audio_url:
        suffix = ".webm"
    elif ".ogg" in audio_url:
        suffix = ".ogg"
    elif ".mp4" in audio_url:
        suffix = ".mp4"

    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp_path = tmp.name
    tmp.close()

    # Usa a URL original para que o yt-dlp gerencie headers/tokens por plataforma
    download_target = original_url if original_url else audio_url

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": tmp_path.replace(suffix, "") + ".%(ext)s",
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "postprocessors": [],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(download_target, download=True)
            if info and "requested_downloads" in info:
                downloaded_path = info["requested_downloads"][0]["filepath"]
            else:
                base = tmp_path.replace(suffix, "")
                matches = glob.glob(base + ".*")
                if not matches:
                    raise Exception("Arquivo baixado não encontrado")
                downloaded_path = matches[0]

        if downloaded_path != tmp_path:
            os.rename(downloaded_path, tmp_path)

        return tmp_path

    except Exception as e:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        raise Exception(f"Erro ao baixar áudio: {e}")


def transcribe_with_whisper(tmp_path: str, api_key: str) -> dict:
    """Envia o arquivo de áudio para o Whisper via OpenRouter."""
    filename = os.path.basename(tmp_path)
    boundary = "----WkFormBoundary7MA4YWxkTrZu0gW"

    with open(tmp_path, "rb") as f:
        audio_data = f.read()

    ext = os.path.splitext(tmp_path)[1].lower()
    mime_map = {
        ".mp3": "audio/mpeg",
        ".m4a": "audio/mp4",
        ".webm": "audio/webm",
        ".ogg": "audio/ogg",
        ".wav": "audio/wav",
    }
    mime = mime_map.get(ext, "audio/mpeg")

    def field(name, value):
        return (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
            f"{value}\r\n"
        ).encode()

    def file_field(name, fname, fmime, data):
        return (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"; filename="{fname}"\r\n'
            f"Content-Type: {fmime}\r\n\r\n"
        ).encode() + data + b"\r\n"

    body = (
        file_field("file", filename, mime, audio_data)
        + field("model", "openai/whisper-1")
        + field("language", "pt")
        + field("response_format", "verbose_json")
        + f"--{boundary}--\r\n".encode()
    )

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


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        tmp_path = None
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length))
            url = body.get("url", "").strip()
            # Chave vem do ambiente do servidor; body é fallback
            api_key = OPENROUTER_API_KEY or body.get("apiKey", "").strip()

            if not url:
                return self._respond(400, {"error": "URL não fornecida"})
            if not api_key:
                return self._respond(400, {"error": "OPENROUTER_API_KEY não configurada no servidor"})

            # 1. Tenta yt-dlp
            audio_url = None
            source = None
            ytdlp_error = None
            cobalt_error = None

            try:
                audio_url = get_audio_url_ytdlp(url)
                source = "ytdlp"
                print(f"[yt-dlp] OK: {audio_url[:80]}...")
            except Exception as e:
                ytdlp_error = str(e)
                print(f"[yt-dlp] falhou: {e}")

            # 2. Fallback Cobalt
            if not audio_url:
                try:
                    audio_url = get_audio_url_cobalt(url)
                    source = "cobalt"
                    print(f"[cobalt] OK: {audio_url[:80]}...")
                except Exception as e:
                    cobalt_error = str(e)
                    print(f"[cobalt] falhou: {e}")

            if not audio_url:
                return self._respond(422, {
                    "error": "Não foi possível extrair o áudio desta URL. Verifique se o link é público.",
                    "details": {"ytdlp": ytdlp_error, "cobalt": cobalt_error},
                })

            # 3. Baixa o áudio
            try:
                tmp_path = download_audio(audio_url, original_url=url)
                print(f"[download] OK: {tmp_path}")
            except Exception as e:
                print(f"[download] ERRO: {e}")
                return self._respond(500, {"error": f"Erro no download: {str(e)}"})

            # 4. Transcreve
            try:
                result = transcribe_with_whisper(tmp_path, api_key)
                print(f"[whisper] OK")
            except Exception as e:
                print(f"[whisper] ERRO: {e}")
                return self._respond(500, {"error": f"Erro no Whisper: {str(e)}"})

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
            self._respond(500, {"error": f"Erro interno: {str(e)}"})

        finally:
            if tmp_path:
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

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
