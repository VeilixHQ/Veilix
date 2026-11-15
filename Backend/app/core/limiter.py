from fastapi import Request

from app.core.config import CLIENT_IP_HEADER


def client_ip(request: Request) -> str:
    if CLIENT_IP_HEADER:
        value = request.headers.get(CLIENT_IP_HEADER, "").strip()
        if value:
            return value
    return request.client.host if request.client else "inconnu"
