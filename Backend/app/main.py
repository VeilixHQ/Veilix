import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routes import admin, alias, beta, destination, domain, email, key, leaks, pgp, preferences
from app.core import scheduler
from app.core.config import BETA_SCHEDULER_ENABLED, CORS_ORIGINS, IS_PRODUCTION

logging.getLogger("uvicorn.access").disabled = True

@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(scheduler.run_forever()) if BETA_SCHEDULER_ENABLED else None
    yield
    if task:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


app = FastAPI(
    lifespan=lifespan,
    title="Veilix API",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

SECURITY_HEADERS = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Resource-Policy": "same-site",
}

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    for header, value in SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    if IS_PRODUCTION:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Veilix-Key-Id", "X-Client-Source"],
)

app.include_router(key.router)
app.include_router(alias.router)
app.include_router(email.router)
app.include_router(destination.router)
app.include_router(domain.router)
app.include_router(pgp.router)
app.include_router(preferences.router)
app.include_router(beta.router)
app.include_router(leaks.router)
app.include_router(admin.router)


@app.get("/")
def health():
    return {"status": "Veilix running", "version": "1.0.0", "architecture": "no-account"}