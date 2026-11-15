from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import CLIENT_IP_HEADER


def client_ip(request: Request) -> str:
    if CLIENT_IP_HEADER:
        value = request.headers.get(CLIENT_IP_HEADER, "").strip()
        if value:
            return value
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip)
