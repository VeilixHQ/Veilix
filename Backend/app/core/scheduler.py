import asyncio
import logging

from sqlalchemy import text
from starlette.concurrency import run_in_threadpool

from app.core import config
from app.db.session import SessionLocal, engine

logger = logging.getLogger("veilix.scheduler")

LOCK_ID = 7_402_917


def run_once() -> dict | None:
    from app.services import beta_service

    with engine.connect() as conn:
        acquired = conn.execute(text("SELECT pg_try_advisory_lock(:id)"), {"id": LOCK_ID}).scalar()
        if not acquired:
            return None
        try:
            db = SessionLocal()
            try:
                return beta_service.tick(db)
            finally:
                db.close()
        finally:
            conn.execute(text("SELECT pg_advisory_unlock(:id)"), {"id": LOCK_ID})
            conn.commit()


async def run_forever() -> None:
    while True:
        try:
            report = await run_in_threadpool(run_once)
            if report and any(report.values()):
                logger.info("Tâches bêta : %s", report)
        except Exception as exc:
            logger.error("Échec des tâches bêta : %s", type(exc).__name__)
        await asyncio.sleep(config.BETA_SCHEDULER_INTERVAL_SECONDS)
