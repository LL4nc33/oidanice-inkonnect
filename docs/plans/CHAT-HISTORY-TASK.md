# v0.5 Chat History & Semantic Search – Claude Code Task

## Context

Read `docs/plans/CHAT-HISTORY-PLAN.md` for the full architecture plan. Read `CLAUDE.md` for project conventions. Read `docs/architecture.md` for the current system architecture. Read `ROADMAP.md` for feature scope.

## Task

Implement v0.5: Chat History with Semantic Search. Follow the implementation order from CHAT-HISTORY-PLAN.md exactly.

## Phase 1: Database Foundation

1. Add `asyncpg`, `sqlalchemy[asyncio]`, `alembic`, `pgvector` to `backend/requirements.txt`
2. Add PostgreSQL + pgvector service to `docker-compose.yml` using `pgvector/pgvector:pg16` image
3. Add database config fields to `backend/config.py`:
   - `database_url`, `history_enabled`, `audio_storage_path`, `embedding_provider`, `embedding_model`, `embedding_url`
4. Create `backend/database/connection.py` with async SQLAlchemy engine + session factory
5. Create `backend/database/models.py` with SQLAlchemy ORM models matching the schema in CHAT-HISTORY-PLAN.md (organizations, sessions, messages with pgvector column)
6. Set up Alembic with async support, create initial migration
7. Initialize database on app startup in `backend/main.py` lifespan

## Phase 2: Session & Message CRUD

8. Create `backend/routers/sessions.py`:
   - `POST /api/sessions` – create session (source_lang, target_lang, audio_enabled)
   - `GET /api/sessions` – list sessions paginated (newest first)
   - `GET /api/sessions/{id}` – get session with message count
   - `DELETE /api/sessions/{id}` – delete session + cascade audio files
   - `PATCH /api/sessions/{id}` – update title, audio_enabled toggle
9. Create `backend/routers/messages.py`:
   - `GET /api/sessions/{id}/messages` – paginated message history
   - `GET /api/sessions/{id}/messages/{mid}/audio` – stream opus audio file
10. Mount new routers in `backend/main.py`

## Phase 3: Pipeline Integration

11. Extend `backend/routers/pipeline.py`:
    - Accept optional `session_id` query parameter
    - After pipeline completes: if session_id provided AND history_enabled, save message to DB
    - Include all timing data (stt_ms, translate_ms, tts_ms) and model_used
12. Audio storage:
    - If session has audio_enabled=True, encode input audio to Opus and save to `{audio_storage_path}/{session_id}/{message_id}.opus`
    - Store relative path in messages.audio_path

## Phase 4: Embeddings & Semantic Search

13. Create `backend/providers/embedding/ollama_embed.py`:
    - Implements embedding generation via Ollama API (`/api/embeddings` endpoint)
    - Model: nomic-embed-text (768 dimensions)
    - Follows existing provider pattern (see providers/base.py)
14. After saving a message in pipeline, fire `asyncio.create_task()` to generate embedding and update the message row. Non-blocking – pipeline response is not delayed.
15. Create `backend/routers/search.py`:
    - `POST /api/search` – accepts query string, generates embedding, searches via pgvector cosine similarity
    - Returns matching messages with session context and similarity score
    - Filterable by org_id, date range, language pair

## Phase 5: Retention & Cleanup

16. Create `backend/database/cleanup.py`:
    - Background asyncio task that runs hourly
    - Deletes sessions where `expires_at < NOW()`
    - Deletes associated audio files from filesystem
    - Logs cleanup stats
17. Create retention settings endpoint:
    - `GET /api/settings/retention`
    - `PUT /api/settings/retention` – update retention_days for org
18. Set `expires_at` on session creation based on org retention_policy

## Phase 6: Gateway Extension

19. Add session/search endpoints to `backend/gateway/router.py`:
    - `GET /v1/sessions`, `POST /v1/sessions`, etc.
    - `POST /v1/search`
    - Same auth + rate limiting as existing gateway endpoints

## Constraints

- Do NOT modify existing `/api/*` endpoint behavior – only extend
- Do NOT modify existing provider ABCs – add new EmbeddingProvider ABC in base.py
- Use `httpx.AsyncClient` for Ollama embedding calls (consistent with existing code)
- All new models use Pydantic, all new DB queries use async SQLAlchemy
- Audio files go to filesystem, NOT binary blobs in PostgreSQL
- Embedding generation must be non-blocking (asyncio.create_task)
- Follow existing code patterns: type hints everywhere, structured error responses
- Keep components < 100 lines where possible
- Test that existing pipeline works unchanged when no session_id is provided

## Delegation

Use `cwe:architect` for any schema or API design questions.
Use `cwe:builder` for implementation.
Use `cwe:quality` for tests after each phase.
