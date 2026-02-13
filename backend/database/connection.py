"""Async SQLAlchemy engine and session factory."""

import logging

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

logger = logging.getLogger(__name__)

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


async def init_db(database_url: str) -> None:
    """Create the async engine and session factory."""
    global _engine, _session_factory
    _engine = create_async_engine(database_url, echo=False, pool_size=5, max_overflow=10)
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    logger.info("Database engine created for %s", database_url.split("@")[-1])


async def close_db() -> None:
    """Dispose the engine on shutdown."""
    global _engine, _session_factory
    if _engine:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("Database engine disposed")


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return the session factory. Raises if not initialized."""
    assert _session_factory is not None, "Database not initialized"
    return _session_factory


def get_engine() -> AsyncEngine:
    """Return the engine. Raises if not initialized."""
    assert _engine is not None, "Database not initialized"
    return _engine
