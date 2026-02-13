"""Session CRUD endpoints."""

import logging
import shutil
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select

from backend.database.connection import get_session_factory
from backend.database.models import Message, Organization, Session
from backend.dependencies import get_settings
from backend.models import SessionCreate, SessionListResponse, SessionResponse, SessionUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

RETENTION_MAP = {
    "24 hours": timedelta(hours=24),
    "7 days": timedelta(days=7),
    "30 days": timedelta(days=30),
    "1 year": timedelta(days=365),
}


def _session_to_response(session: Session, message_count: int = 0) -> SessionResponse:
    return SessionResponse(
        id=str(session.id),
        org_id=str(session.org_id) if session.org_id else None,
        title=session.title,
        source_lang=session.source_lang,
        target_lang=session.target_lang,
        audio_enabled=session.audio_enabled,
        message_count=message_count,
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
        expires_at=session.expires_at.isoformat() if session.expires_at else None,
    )


@router.post("", response_model=SessionResponse)
async def create_session(body: SessionCreate) -> SessionResponse:
    factory = get_session_factory()
    async with factory() as db:
        # Determine retention from org or default to 30 days
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        audio_enabled = body.audio_enabled
        if body.org_id:
            org = await db.get(Organization, uuid.UUID(body.org_id))
            if org:
                policy = org.retention_policy
                if policy == "unlimited":
                    expires_at = None
                elif policy in RETENTION_MAP:
                    expires_at = datetime.now(timezone.utc) + RETENTION_MAP[policy]
                if not body.audio_enabled:
                    audio_enabled = org.audio_enabled_default

        session = Session(
            source_lang=body.source_lang,
            target_lang=body.target_lang,
            audio_enabled=audio_enabled,
            title=body.title,
            org_id=uuid.UUID(body.org_id) if body.org_id else None,
            expires_at=expires_at,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return _session_to_response(session)


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> SessionListResponse:
    factory = get_session_factory()
    async with factory() as db:
        # Count total
        total_result = await db.execute(select(func.count(Session.id)))
        total = total_result.scalar() or 0

        # Fetch sessions with message count
        stmt = (
            select(Session, func.count(Message.id).label("msg_count"))
            .outerjoin(Message, Message.session_id == Session.id)
            .group_by(Session.id)
            .order_by(Session.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(stmt)
        rows = result.all()

        sessions = [_session_to_response(row[0], row[1]) for row in rows]
        return SessionListResponse(sessions=sessions, total=total)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str) -> SessionResponse:
    factory = get_session_factory()
    async with factory() as db:
        uid = uuid.UUID(session_id)
        stmt = (
            select(Session, func.count(Message.id).label("msg_count"))
            .outerjoin(Message, Message.session_id == Session.id)
            .where(Session.id == uid)
            .group_by(Session.id)
        )
        result = await db.execute(stmt)
        row = result.first()
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")
        return _session_to_response(row[0], row[1])


@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, body: SessionUpdate) -> SessionResponse:
    factory = get_session_factory()
    async with factory() as db:
        uid = uuid.UUID(session_id)
        session = await db.get(Session, uid)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if body.title is not None:
            session.title = body.title
        if body.audio_enabled is not None:
            session.audio_enabled = body.audio_enabled
        session.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(session)

        # Get message count
        count_result = await db.execute(
            select(func.count(Message.id)).where(Message.session_id == uid)
        )
        msg_count = count_result.scalar() or 0
        return _session_to_response(session, msg_count)


@router.delete("/{session_id}")
async def delete_session(session_id: str) -> dict:
    factory = get_session_factory()
    s = get_settings()
    async with factory() as db:
        uid = uuid.UUID(session_id)
        session = await db.get(Session, uid)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Delete audio files
        audio_dir = Path(s.audio_storage_path) / str(session.id)
        if audio_dir.exists():
            shutil.rmtree(audio_dir, ignore_errors=True)

        await db.delete(session)
        await db.commit()
        return {"deleted": True, "id": session_id}
