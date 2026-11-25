from fastapi import APIRouter, Depends, HTTPException, Request

from app.core import config, rate_limit
from app.core.limiter import client_ip
from app.core.rate_limit import ip_limit
from app.schemas.leaks import Breach, LeakCheckRequest, LeakCheckResult
from app.services import breach_check_service

router = APIRouter(tags=["Fuites"])

BUSY = "Le service de vérification est très sollicité. Réessayez dans une minute."


@router.post(
    "/leaks/check",
    response_model=LeakCheckResult,
    dependencies=[Depends(ip_limit("leak-check-hour", config.LEAK_CHECK_PER_IP_HOUR, 3600))],
)
def check_leaks(body: LeakCheckRequest, request: Request):
    if body.website:
        return LeakCheckResult(found=False, breaches=[])
    rate_limit.hit("leak-check-day", client_ip(request), config.LEAK_CHECK_PER_IP_DAY, 24 * 3600, "Trop de vérifications aujourd'hui. Réessayez demain.")
    rate_limit.hit("leak-check-global", "all", config.LEAK_CHECK_GLOBAL_PER_MINUTE, 60, BUSY)
    try:
        breaches = breach_check_service.check(str(body.email))
    except breach_check_service.LeakServiceUnavailable:
        raise HTTPException(status_code=503, detail=BUSY) from None
    return LeakCheckResult(found=bool(breaches), breaches=[Breach(**breach) for breach in breaches])
