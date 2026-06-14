from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error
from urllib.parse import urlencode

# Configuração lida do ambiente do servidor (Vercel) — NUNCA exposta ao frontend.
SUPABASE_URL = (
    os.environ.get("SUPABASE_URL")
    or os.environ.get("VITE_SUPABASE_URL")
    or ""
).rstrip("/")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Apenas este email tem acesso ao painel de superadmin.
ADMIN_EMAIL = "contato@grpsupra.com.br"

# Duração de banimento usada para "desabilitar" um usuário (~100 anos).
BAN_DURATION = "876000h"


def _request(method, path, token=None, body=None, params=None, extra_headers=None):
    """Chamada HTTP à API do Supabase. Retorna (status, json_decodificado)."""
    url = f"{SUPABASE_URL}{path}"
    if params:
        url += "?" + urlencode(params)

    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {token or SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)

    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"error": raw}
        return e.code, parsed


def get_caller_email(token):
    """Valida o token do usuário chamador e devolve o email dele."""
    if not token:
        return None
    status, data = _request("GET", "/auth/v1/user", token=token)
    if status == 200 and isinstance(data, dict):
        return data.get("email")
    return None


def fetch_settings_map():
    """Mapa user_id -> {api_key, disabled} a partir da tabela user_settings."""
    status, data = _request(
        "GET",
        "/rest/v1/user_settings",
        params={"select": "user_id,api_key,provider,disabled"},
    )
    result = {}
    if status == 200 and isinstance(data, list):
        for row in data:
            result[row.get("user_id")] = row
    return result


def upsert_settings(user_id, fields):
    """Insere/atualiza a linha de user_settings do usuário."""
    body = [{"user_id": user_id, **fields}]
    return _request(
        "POST",
        "/rest/v1/user_settings",
        body=body,
        extra_headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )


def action_list_users():
    status, data = _request(
        "GET", "/auth/v1/admin/users", params={"per_page": 1000}
    )
    if status != 200:
        return status, data

    settings = fetch_settings_map()
    users = data.get("users", []) if isinstance(data, dict) else []
    out = []
    for u in users:
        uid = u.get("id")
        s = settings.get(uid, {})
        out.append({
            "id": uid,
            "email": u.get("email"),
            "name": (u.get("user_metadata") or {}).get("name") or "",
            "created_at": u.get("created_at"),
            "disabled": bool(u.get("banned_until")),
            "provider": s.get("provider"),
            "api_key": s.get("api_key"),
        })
    return 200, {"users": out}


def action_create_user(payload):
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or "opinify123!"
    name = (payload.get("name") or "").strip()
    if not email:
        return 400, {"error": "Email é obrigatório."}

    return _request("POST", "/auth/v1/admin/users", body={
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {"name": name},
    })


def action_set_status(payload):
    user_id = payload.get("user_id")
    disabled = bool(payload.get("disabled"))
    if not user_id:
        return 400, {"error": "user_id é obrigatório."}

    status, data = _request(
        "PUT",
        f"/auth/v1/admin/users/{user_id}",
        body={"ban_duration": BAN_DURATION if disabled else "none"},
    )
    if status == 200:
        upsert_settings(user_id, {"disabled": disabled})
    return status, data


def action_set_api_key(payload):
    user_id = payload.get("user_id")
    api_key = payload.get("api_key")
    provider = payload.get("provider")
    if not user_id:
        return 400, {"error": "user_id é obrigatório."}
    if provider not in ("openai", "anthropic", "openrouter"):
        return 400, {"error": "Provedor inválido."}

    status, data = upsert_settings(user_id, {
        "provider": provider,
        "api_key": (api_key or "").strip() or None,
    })
    if status in (200, 201, 204):
        return 200, {"ok": True}
    return status, (data or {"error": "Falha ao salvar a API key."})


ACTIONS = {
    "list_users": lambda p: action_list_users(),
    "create_user": action_create_user,
    "set_status": action_set_status,
    "set_api_key": action_set_api_key,
}


class handler(BaseHTTPRequestHandler):
    def _send(self, status, body):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        if not SUPABASE_URL or not SERVICE_ROLE_KEY:
            self._send(500, {"error": "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no servidor."})
            return

        # Autenticação: token do usuário chamador no header Authorization.
        auth = self.headers.get("Authorization", "")
        token = auth[7:].strip() if auth.lower().startswith("bearer ") else ""
        email = get_caller_email(token)
        if not email:
            self._send(401, {"error": "Não autenticado."})
            return
        if email.lower() != ADMIN_EMAIL.lower():
            self._send(403, {"error": "Acesso restrito ao superadmin."})
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length).decode() if length else "{}"
            payload = json.loads(raw or "{}")
        except Exception:
            self._send(400, {"error": "Corpo da requisição inválido."})
            return

        action = payload.get("action")
        fn = ACTIONS.get(action)
        if not fn:
            self._send(400, {"error": f"Ação desconhecida: {action}"})
            return

        try:
            status, data = fn(payload)
            self._send(status, data if data is not None else {"ok": True})
        except Exception as e:
            self._send(500, {"error": str(e)})
