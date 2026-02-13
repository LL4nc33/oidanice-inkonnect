"""Message history endpoints."""

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import func, select

from backend.database.connection import get_session_factory
from backend.database.models import Message, Session
from backend.dependencies import get_settings
from backend.models import MessageListResponse, MessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["messages"])


def _message_to_response(msg: Message) -> MessageResponse:
    return MessageResponse(
        id=str(msg.id),
        session_id=str(msg.session_id),
        direction=msg.direction,
        original_text=msg.original_text,
        translated_text=msg.translated_text,
        original_lang=msg.original_lang,
        translated_lang=msg.translated_lang,
        audio_path=msg.audio_path,
        stt_ms=msg.stt_ms,
        translate_ms=msg.translate_ms,
        tts_ms=msg.tts_ms,
        model_used=msg.model_used,
        created_at=msg.created_at.isoformat(),
    )


@router.get("/{session_id}/messages", response_model=MessageListResponse)
async def get_messages(
    session_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> MessageListResponse:
    factory = get_session_factory()
    async with factory() as db:
        uid = uuid.UUID(session_id)

        # Check session exists
        session = await db.get(Session, uid)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Count total
        total_result = await db.execute(
            select(func.count(Message.id)).where(Message.session_id == uid)
        )
        total = total_result.scalar() or 0

        # Fetch messages
        stmt = (
            select(Message)
            .where(Message.session_id == uid)
            .order_by(Message.created_at.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(stmt)
        messages = [_message_to_response(m) for m in result.scalars()]

        return MessageListResponse(messages=messages, total=total)


@router.get("/{session_id}/messages/{message_id}/audio")
async def get_message_audio(session_id: str, message_id: str) -> FileResponse:
    factory = get_session_factory()
    s = get_settings()
    async with factory() as db:
        msg_uid = uuid.UUID(message_id)
        msg = await db.get(Message, msg_uid)
        if not msg or str(msg.session_id) != session_id:
            raise HTTPException(status_code=404, detail="Message not found")
        if not msg.audio_path:
            raise HTTPException(status_code=404, detail="No audio for this message")

        audio_file = Path(s.audio_storage_path) / msg.audio_path
        if not audio_file.exists():
            raise HTTPException(status_code=404, detail="Audio file not found")

        return FileResponse(
            path=str(audio_file),
            media_type="audio/opus",
            filename=f"{message_id}.opus",
        )
