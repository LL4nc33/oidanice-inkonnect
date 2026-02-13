"""Background task for cleaning up expired sessions and audio files."""

import asyncio
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import delete, select

from backend.database.connection import get_session_factory
from backend.database.models import Session
from backend.dependencies import get_settings

logger = logging.getLogger(__name__)


async def cleanup_expired_sessions() -> dict:
    """Delete expired sessions and their audio files. Returns stats."""
    s = get_settings()
    factory = get_session_factory()
    deleted_sessions = 0
    deleted_audio_dirs = 0

    async with factory() as db:
        # Find expired sessions
        now = datetime.now(timezone.utc)
        stmt = select(Session).where(Session.expires_at.isnot(None), Session.expires_at < now)
        result = await db.execute(stmt)
        expired = result.scalars().all()

        for session in expired:
            # Delete audio directory
            audio_dir = Path(s.audio_storage_path) / str(session.id)
            if audio_dir.exists():
                shutil.rmtree(audio_dir, ignore_errors=True)
                deleted_audio_dirs += 1

        if expired:
            # Bulk delete (cascade handles messages)
            expired_ids = [session.id for session in expired]
            await db.execute(delete(Session).where(Session.id.in_(expired_ids)))
            await db.commit()
            deleted_sessions = len(expired_ids)

    return {"deleted_sessions": deleted_sessions, "deleted_audio_dirs": deleted_audio_dirs}


async def cleanup_loop() -> None:
    """Run cleanup every hour."""
    while True:
        try:
            stats = await cleanup_expired_sessions()
            if stats["deleted_sessions"] > 0:
                logger.info("Cleanup: deleted %d sessions, %d audio dirs", stats["deleted_sessions"], stats["deleted_audio_dirs"])
        except Exception as exc:
            logger.warning("Cleanup failed: %s", exc)
        await asyncio.sleep(3600)  # 1 hour
