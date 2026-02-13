"""Semantic search endpoint using pgvector cosine similarity."""

import logging
import uuid

from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy import select

from backend.database.connection import get_session_factory
from backend.database.models import Message, Session
from backend.dependencies import get_settings
from backend.providers.embedding.ollama_embed import OllamaEmbeddingProvider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    org_id: str | None = None
    limit: int = 20
    source_lang: str | None = None
    target_lang: str | None = None


class SearchResult(BaseModel):
    message_id: str
    session_id: str
    original_text: str
    translated_text: str
    original_lang: str
    translated_lang: str
    similarity: float
    created_at: str


class SearchResponse(BaseModel):
    results: list[SearchResult]
    query: str


@router.post("/search", response_model=SearchResponse)
async def semantic_search(body: SearchRequest) -> SearchResponse:
    s = get_settings()

    # Generate query embedding
    provider = OllamaEmbeddingProvider(base_url=s.embedding_url, model=s.embedding_model)
    try:
        query_embedding = await provider.embed(body.query)
    finally:
        await provider.cleanup()

    factory = get_session_factory()
    async with factory() as db:
        # Build query with cosine distance
        distance = Message.embedding.cosine_distance(query_embedding)
        stmt = (
            select(
                Message.id,
                Message.session_id,
                Message.original_text,
                Message.translated_text,
                Message.original_lang,
                Message.translated_lang,
                Message.created_at,
                (1 - distance).label("similarity"),
            )
            .where(Message.embedding.isnot(None))
        )

        # Apply filters
        if body.org_id:
            stmt = stmt.join(Session, Session.id == Message.session_id).where(
                Session.org_id == uuid.UUID(body.org_id)
            )
        if body.source_lang:
            stmt = stmt.where(Message.original_lang == body.source_lang)
        if body.target_lang:
            stmt = stmt.where(Message.translated_lang == body.target_lang)

        stmt = stmt.order_by(distance).limit(body.limit)
        result = await db.execute(stmt)
        rows = result.all()

    results = [
        SearchResult(
            message_id=str(row[0]),
            session_id=str(row[1]),
            original_text=row[2],
            translated_text=row[3],
            original_lang=row[4],
            translated_lang=row[5],
            created_at=row[6].isoformat(),
            similarity=round(float(row[7]), 4),
        )
        for row in rows
    ]

    return SearchResponse(results=results, query=body.query)
