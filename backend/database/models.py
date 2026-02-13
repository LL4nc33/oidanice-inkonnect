"""SQLAlchemy ORM models for chat history."""

import uuid
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    retention_policy: Mapped[str] = mapped_column(String(50), nullable=False, default="30 days")
    audio_enabled_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    sessions: Mapped[list["Session"]] = relationship(back_populates="organization", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_lang: Mapped[str] = mapped_column(String(10), nullable=False)
    target_lang: Mapped[str] = mapped_column(String(10), nullable=False)
    audio_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped[Organization | None] = relationship(back_populates="sessions")
    messages: Mapped[list["Message"]] = relationship(back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_sessions_org", "org_id"),
        Index("idx_sessions_expires", "expires_at"),
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)  # 'source' or 'target'
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    original_lang: Mapped[str] = mapped_column(String(10), nullable=False)
    translated_lang: Mapped[str] = mapped_column(String(10), nullable=False)
    audio_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    embedding = mapped_column(Vector(768), nullable=True)
    stt_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    translate_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tts_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    session: Mapped[Session] = relationship(back_populates="messages")

    __table_args__ = (
        Index("idx_messages_session", "session_id"),
        Index("idx_messages_created", "created_at"),
    )
