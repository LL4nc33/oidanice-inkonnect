# InKonnect Chat History & Semantic Search – Implementation Plan

## Overview

Add persistent conversation history with Messenger-style UI, optional audio storage, user-configurable retention, and semantic search over all past translations using PostgreSQL + pgvector.

## Architecture Decision Records

### ADR-1: PostgreSQL + pgvector (not Qdrant, not SQLite)
- **Structured data** (sessions, messages, users, timestamps) → relational PostgreSQL
- **Semantic search** ("Gespräche über Herzprobleme" finds "Brustschmerzen") → pgvector extension
- **One container** for both capabilities, no extra infrastructure
- SQLite rejected: not robust enough for concurrent access / multi-user
- Qdrant rejected: vector-only DB, would need a second DB for structured data anyway

### ADR-2: Audio Storage – Hybrid (optional per session)
- Default: **text only** (transcript + translation stored)
- Toggle per session: enable audio recording storage
- Audio format: **Opus-compressed** (~16kbit/s, 1 min ≈ 120 KB)
- Storage: filesystem with DB reference (path in messages table), NOT binary in DB
- Audio files stored under `data/audio/{session_id}/{message_id}.opus`

### ADR-3: Retention – User-Configurable
- Each user/organization sets their own retention policy
- Presets: 24 hours, 7 days, 30 days, 1 year, unlimited
- Custom duration also possible
- Background cleanup job (asyncio task) runs hourly, deletes expired sessions + audio files
- DSGVO-compliant: medical documentation (10 years), hotel (24 hours), etc.

### ADR-4: Embedding Model – nomic-embed-text via Ollama
- Runs on **CPU**, ~300 MB RAM, no GPU impact
- Embeddings generated **async** after each message (non-blocking pipeline)
- Stored in pgvector column alongside message text
- Search via cosine similarity

### ADR-5: Translation Model – gemma3:4b (Default)
- Benchmark winner: accuracy 9/10, speed 7/10, 3.3 GB VRAM
- Fallback: ministral-3:3b (accuracy 8/10, speed 9/10, 3.0 GB)
- NGO override: qwen3:4b for Farsi/Dari/Somali (119 languages, but speed 3/10)

## Final Stack

| Component | Model | Runs On | Resource |
|-----------|-------|---------|----------|
| STT | faster-whisper (small) | CPU | RAM |
| Translation | gemma3:4b (default) | GPU | 3.3 GB VRAM |
| TTS | Chatterbox (23 langs) | GPU | ~3 GB VRAM |
| Embeddings | nomic-embed-text | CPU | ~300 MB RAM |
| Database | PostgreSQL 16 + pgvector | CPU | minimal |
| **GPU Total** | | | **~6.3 GB ✅** |

## Database Schema

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    retention_policy INTERVAL NOT NULL DEFAULT '30 days',
    audio_enabled_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500),                        -- auto-generated or user-set
    source_lang VARCHAR(10) NOT NULL,          -- e.g. 'de'
    target_lang VARCHAR(10) NOT NULL,          -- e.g. 'ar'
    audio_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ                     -- computed from org retention_policy
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL,            -- 'source' or 'target' (who spoke)
    original_text TEXT NOT NULL,               -- STT output (original language)
    translated_text TEXT NOT NULL,             -- LLM translation
    original_lang VARCHAR(10) NOT NULL,
    translated_lang VARCHAR(10) NOT NULL,
    audio_path VARCHAR(500),                   -- nullable, path to opus file
    embedding vector(768),                     -- nomic-embed-text dimension
    stt_ms INTEGER,
    translate_ms INTEGER,
    tts_ms INTEGER,
    model_used VARCHAR(100),                   -- e.g. 'gemma3:4b'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_sessions_org ON sessions(org_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- pgvector index for semantic search (IVFFlat for performance)
CREATE INDEX idx_messages_embedding ON messages
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## New Backend Structure

```
backend/
├── ... (existing files unchanged)
├── database/
│   ├── __init__.py
│   ├── connection.py        # async SQLAlchemy engine + session factory
│   ├── models.py            # SQLAlchemy ORM models (Organization, Session, Message)
│   ├── migrations/          # Alembic migrations
│   └── cleanup.py           # Background retention cleanup task
├── providers/
│   ├── ... (existing)
│   └── embedding/
│       ├── __init__.py
│       └── ollama_embed.py  # nomic-embed-text via Ollama API
├── routers/
│   ├── ... (existing)
│   ├── sessions.py          # CRUD for sessions
│   ├── messages.py          # Message history + search
│   └── search.py            # Semantic search endpoint
└── gateway/
    ├── ... (existing)
    └── router.py            # Add session/search endpoints to gateway too
```

## New API Endpoints

### Session Management (`/api/sessions`)

```
POST   /api/sessions                    # Create new session
GET    /api/sessions                    # List sessions (paginated)
GET    /api/sessions/{id}               # Get session with messages
DELETE /api/sessions/{id}               # Delete session + audio
PATCH  /api/sessions/{id}               # Update title, audio toggle
```

### Messages (`/api/sessions/{id}/messages`)

```
GET    /api/sessions/{id}/messages      # Get message history (paginated)
GET    /api/sessions/{id}/messages/{mid}/audio  # Stream audio file
```

### Semantic Search (`/api/search`)

```
POST   /api/search                      # Semantic search across all sessions
  Body: { "query": "Herzprobleme", "org_id": "...", "limit": 20 }
  Response: [{ session_id, message_id, original_text, translated_text,
               similarity_score, created_at }]
```

### Settings (`/api/settings`)

```
GET    /api/settings/retention          # Get current retention policy
PUT    /api/settings/retention          # Update retention policy
  Body: { "retention_days": 30 }        # or null for unlimited
```

## Pipeline Integration

The existing `/api/pipeline` endpoint gets extended:

1. **Before**: Audio in → STT → Translate → TTS → Response
2. **After**: Audio in → STT → Translate → TTS → **Save to DB** → **Embed async** → Response

Changes to `routers/pipeline.py`:
- Accept optional `session_id` query parameter
- If provided: save message to DB after pipeline completes
- If audio_enabled on session: save opus file to disk
- Fire-and-forget embedding generation (asyncio.create_task)

The pipeline response remains unchanged – chat history is a side-effect, not a blocking operation.

## Docker Compose Addition

```yaml
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: inkonnect
      POSTGRES_USER: inkonnect
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-inkonnect_dev}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U inkonnect"]
      interval: 5s
      timeout: 5s
      retries: 5
```

## Config Additions (backend/config.py)

```python
# Database
database_url: str = "postgresql+asyncpg://inkonnect:inkonnect_dev@localhost:5432/inkonnect"

# Chat History
history_enabled: bool = True
audio_storage_path: str = "data/audio"

# Embeddings
embedding_provider: str = "ollama"          # only option for now
embedding_model: str = "nomic-embed-text"
embedding_url: str = "http://localhost:11434"  # ollama URL
```

## Implementation Order

1. **PostgreSQL + pgvector container** in docker-compose.yml
2. **Database layer**: connection.py, ORM models, Alembic setup
3. **Session CRUD**: routers/sessions.py + messages.py
4. **Pipeline integration**: save messages on pipeline calls
5. **Audio storage**: opus encoding, file management, streaming endpoint
6. **Embedding provider**: ollama_embed.py with nomic-embed-text
7. **Semantic search**: search.py endpoint + pgvector queries
8. **Retention cleanup**: background task with configurable policies
9. **Gateway endpoints**: expose sessions/search on /v1/
10. **Frontend**: Chat history UI (separate task)

## Dependencies to Add

```
# backend/requirements.txt additions
asyncpg==0.30.0
sqlalchemy[asyncio]==2.0.36
alembic==1.14.1
pgvector==0.3.6
opuslib==3.0.1          # opus encoding for audio storage
```

## Notes

- Embedding dimension 768 matches nomic-embed-text output
- IVFFlat index needs ~1000+ rows before it's effective; start with exact search, switch later
- Audio cleanup must delete files AND db rows (cascade handles db, cleanup job handles files)
- Qwen3:4b with /no_think prefix for NGO languages (Farsi/Dari/Somali) – swap via provider dropdown
- All timing data (stt_ms, translate_ms, tts_ms) already available from pipeline response
