from http.server import BaseHTTPRequestHandler
import json
import os
import re
import tempfile
import urllib.request
from urllib.parse import quote

COBALT_URL = os.environ.get("COBALT_URL", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")


def extract_instagram_shortcode(url: str) -> str:
    """Extrai o shortcode de uma URL do Instagram."""
    url = url.split('?')[0]
    pattern = r'instagram\.com/(?:[^/]+/)?(?:reel|p)/([^/?]+)'
    match = re.search(pattern, url)
    if not match:
        raise Exception('URL do Instagram inválida')
    return match.group(1)


def get_audio_url_instagram(url: str) -> str:
    """
    Extrai a URL do vídeo do Instagram via GraphQL interno.
    Sem autenticação, sem API key — igual ao que o browser faz.
    """
    shortcode = extract_instagram_shortcode(url)

    variables = quote(f'{{"shortcode":"{shortcode}"}}')
    payload = f'variables={variables}&doc_id=24368985919464652'

    headers = {
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'x-csrftoken': 'missing',
        'x-ig-app-id': '936619743392459',
        'accept': '*/*',
        'accept-language': 'pt-BR,pt;q=0.9',
        'origin': 'https://www.instagram.com',
        'referer': f'https://www.instagram.com/reel/{shortcode}/',
    }

    req = urllib.request.Request(
        'https://www.instagram.com/graphql/query',
        data=payload.encode(),
        headers=headers,
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
            print(f'[instagram] status: {resp.status}')
            print(f'[instagram] resposta raw (500 chars): {raw[:500]}')
            data = json.loads(raw)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        print(f'[instagram] HTTP {e.code}: {body[:300]}')
        raise Exception(f'HTTP {e.code}: {body[:200]}')

    print(f'[instagram] chaves do data: {list(data.keys())}')
    if 'data' in data:
        print(f'[instagram] chaves do data.data: {list(data["data"].keys())}')

    try:
        items = (
            data['data']
            ['xdt_api__v1__media__shortcode__web_info']
            ['items']
        )
        if not items:
            raise Exception('Items vazio')

        video_versions = items[0].get('video_versions', [])
        if not video_versions:
            raise Exception('Sem video_versions')

        best = video_versions[0]
        video_url = best.get('url')
        if not video_url:
            raise Exception('URL vazia')

        print(f'[instagram] OK: {best.get("width")}x{best.get("height")}')
        return video_url

    except KeyError as e:
        print(f'[instagram] KeyError: {e} — estrutura completa: {json.dumps(data)[:500]}')
        raise Exception(f'Estrutura inesperada: {e}')


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
    """
    Baixa o áudio para arquivo temporário.
    Para URLs do CDN do Instagram, baixa diretamente com urllib.
    Para outras URLs, usa yt-dlp.
    """
    import yt_dlp

    # Detecta se é URL direta do CDN (Instagram, Facebook CDN, etc.)
    is_cdn_url = any(cdn in audio_url for cdn in [
        'cdninstagram.com',
        'fbcdn.net',
        'fna.fbcdn.net',
        'scontent',
    ])

    # Detecta extensão pelo conteúdo da URL
    suffix = '.mp4'
    if '.webm' in audio_url:
        suffix = '.webm'
    elif '.m4a' in audio_url:
        suffix = '.m4a'

    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp_path = tmp.name
    tmp.close()

    if is_cdn_url:
        # Download direto — a URL do CDN não precisa de autenticação
        # mas precisa dos headers corretos para não ser bloqueada
        try:
            req = urllib.request.Request(
                audio_url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                    'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9',
                    'Referer': 'https://www.instagram.com/',
                    'Origin': 'https://www.instagram.com',
                    'Range': 'bytes=0-',
                }
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                with open(tmp_path, 'wb') as f:
                    f.write(resp.read())

            size = os.path.getsize(tmp_path)
            print(f'[download_cdn] OK: {size / 1024 / 1024:.1f}MB')
            return tmp_path

        except Exception as e:
            print(f'[download_cdn] falhou: {e} — tentando yt-dlp')
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    # Para YouTube e outras URLs — usa yt-dlp com a URL original
    download_target = original_url if original_url and 'instagram.com' not in original_url else audio_url

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': tmp_path.replace(suffix, '') + '.%(ext)s',
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(download_target, download=True)
            if 'requested_downloads' in info:
                downloaded_path = info['requested_downloads'][0]['filepath']
            else:
                import glob
                base = tmp_path.replace(suffix, '')
                matches = glob.glob(base + '.*')
                if not matches:
                    raise Exception('Arquivo baixado não encontrado')
                downloaded_path = matches[0]

        if downloaded_path != tmp_path:
            os.rename(downloaded_path, tmp_path)

        return tmp_path

    except Exception as e:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        raise Exception(f'Erro ao baixar áudio: {e}')


def transcribe_with_whisper(tmp_path: str, api_key: str) -> dict:
    """Envia o arquivo de áudio para o Whisper via Groq."""
    import requests

    with open(tmp_path, "rb") as f:
        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={
                "Authorization": f"Bearer {api_key}",
            },
            files={
                "file": (os.path.basename(tmp_path), f, "audio/mpeg"),
            },
            data={
                "model": "whisper-1",
                "language": "pt",
                "response_format": "verbose_json",
            },
            timeout=120,
        )

    if not response.ok:
        raise Exception(f"Whisper erro {response.status_code}: {response.text}")

    return response.json()


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        tmp_path = None
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length))
            url = body.get("url", "").strip()
            api_key = OPENAI_API_KEY or body.get("apiKey", "").strip()

            if not url:
                return self._respond(400, {"error": "URL não fornecida"})
            if not api_key:
                return self._respond(400, {"error": "OPENAI_API_KEY não configurada no servidor"})

            # 1. Detecta se é Instagram
            is_instagram = 'instagram.com' in url

            audio_url = None
            source = None
            ytdlp_error = None
            cobalt_error = None
            instagram_error = None

            if is_instagram:
                # Instagram: usa GraphQL interno primeiro
                try:
                    audio_url = get_audio_url_instagram(url)
                    source = 'instagram_graphql'
                    print(f'[instagram_graphql] OK')
                except Exception as e:
                    instagram_error = str(e)
                    print(f'[instagram_graphql] falhou: {e}')

                # Fallback para yt-dlp se GraphQL falhar
                if not audio_url:
                    try:
                        audio_url = get_audio_url_ytdlp(url)
                        source = 'ytdlp'
                        print(f'[yt-dlp] OK como fallback')
                    except Exception as e:
                        ytdlp_error = str(e)
                        print(f'[yt-dlp] falhou: {e}')

            else:
                # YouTube e outros: usa yt-dlp normalmente
                try:
                    audio_url = get_audio_url_ytdlp(url)
                    source = 'ytdlp'
                    print(f'[yt-dlp] OK')
                except Exception as e:
                    ytdlp_error = str(e)
                    print(f'[yt-dlp] falhou: {e}')

            # Fallback final: Cobalt
            if not audio_url:
                try:
                    audio_url = get_audio_url_cobalt(url)
                    source = 'cobalt'
                    print(f'[cobalt] OK como fallback final')
                except Exception as e:
                    cobalt_error = str(e)
                    print(f'[cobalt] falhou: {e}')

            if not audio_url:
                return self._respond(422, {
                    "error": "Não foi possível extrair o áudio desta URL. Verifique se o link é público.",
                    "details": {
                        "instagram": instagram_error,
                        "ytdlp": ytdlp_error,
                        "cobalt": cobalt_error,
                    },
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
