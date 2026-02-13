"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-02-13
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "organizations",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("retention_policy", sa.String(50), nullable=False, server_default="30 days"),
        sa.Column("audio_enabled_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )

    op.create_table(
        "sessions",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("org_id", sa.UUID(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("source_lang", sa.String(10), nullable=False),
        sa.Column("target_lang", sa.String(10), nullable=False),
        sa.Column("audio_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_sessions_org", "sessions", ["org_id"])
    op.create_index("idx_sessions_expires", "sessions", ["expires_at"])

    op.create_table(
        "messages",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", sa.UUID(), sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("direction", sa.String(10), nullable=False),
        sa.Column("original_text", sa.Text(), nullable=False),
        sa.Column("translated_text", sa.Text(), nullable=False),
        sa.Column("original_lang", sa.String(10), nullable=False),
        sa.Column("translated_lang", sa.String(10), nullable=False),
        sa.Column("audio_path", sa.String(500), nullable=True),
        sa.Column("embedding", Vector(768), nullable=True),
        sa.Column("stt_ms", sa.Integer(), nullable=True),
        sa.Column("translate_ms", sa.Integer(), nullable=True),
        sa.Column("tts_ms", sa.Integer(), nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("idx_messages_session", "messages", ["session_id"])
    op.create_index("idx_messages_created", "messages", ["created_at"])


def downgrade() -> None:
    op.drop_table("messages")
    op.drop_table("sessions")
    op.drop_table("organizations")
    op.execute("DROP EXTENSION IF EXISTS vector")
