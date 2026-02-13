# Architecture

## System Overview

```
                           ┌──────────────────────────────────┐
┌─────────────┐            │         FastAPI Backend           │
│   Browser    │──/api/*──>│                                  │
│  React PWA   │<──────────│  ┌─────────┐  ┌──────────────┐  │
└─────────────┘            │  │ Routers │  │  Resolver     │  │
                           │  └────┬────┘  └──────┬───────┘  │
┌─────────────┐            │       │              │           │
│  External    │──/v1/*───>│  ┌────▼──────────────▼────────┐  │
│  Clients     │<──────────│  │    Provider Abstraction     │  │
└─────────────┘            │  │    Layer                    │  │
                           │  └──┬────────┬────────┬───────┘  │
                           │     │        │        │          │
                           │  ┌──▼──┐ ┌──▼──┐ ┌──▼───────┐  │
                           │  │ STT │ │ TTS │ │Translate  │  │
                           │  └──┬──┘ └──┬──┘ └──┬───────┘  │
                           └─────┼───────┼───────┼───────────┘
                                 │       │       │
                           ┌─────▼──┐ ┌─▼────┐ ┌▼───────┐
                           │Whisper │ │Piper │ │ Ollama  │
                           │  (CPU) │ │(CPU) │ │ (GPU)   │
                           └────────┘ └──────┘ └────────┘
                                      ┌─▼──────────┐
                                      │ Chatterbox  │
                                      │   (GPU)     │
                                      └─────────────┘
```

## API Layers

### Frontend API (`/api/*`)

Internal endpoints for the React PWA. Accepts settings as query parameters, returns base64-encoded audio in JSON responses.

### Gateway API (`/v1/*`)

OpenAI-compatible endpoints for external clients. Features:

- **Auth**: API key via `Authorization: Bearer` or `X-API-Key` header
- **Rate limiting**: In-memory token bucket, pipeline calls cost 3 tokens
- **Raw audio**: TTS returns WAV bytes directly (no base64 overhead)
- **Service discovery**: `/v1/health`, `/v1/models`, `/v1/voices`, `/v1/languages`

Both layers share the same provider instances via the shared resolver (`backend/resolver.py`).

## Provider Pattern

Each AI capability (STT, TTS, Translation) is abstracted behind an interface in `backend/providers/base.py`. Concrete implementations live in subdirectories:

- `providers/stt/whisper_local.py` -- faster-whisper (CPU)
- `providers/tts/piper_local.py` -- Piper TTS (CPU, local)
- `providers/tts/chatterbox_remote.py` -- Chatterbox TTS (GPU)
- `providers/translate/ollama_local.py` -- Ollama LLM (GPU)
- `providers/translate/openai_compat.py` -- OpenAI-compatible APIs (remote)

Factory functions in `providers/__init__.py` create the correct provider based on `config.py` settings.

### Runtime Provider Switching

The shared resolver in `backend/resolver.py` handles runtime switching. Both `/api/*` and `/v1/*` routers use it:

```python
def resolve_tts(tts_provider, voice, chatterbox_url=None):
    if tts_provider == "chatterbox":
        return ChatterboxRemoteProvider(base_url=...), True  # ad-hoc
    singleton = get_tts()
    if singleton is None:
        raise RuntimeError("No TTS provider available")
    return singleton, False  # singleton
```

Ad-hoc providers are always cleaned up in a `finally` block.

## Data Flow: Full Pipeline

1. User records audio in browser (MediaRecorder API -> WebM/Opus Blob)
2. Frontend sends fire-and-forget warmup request (`POST /api/gpu/warmup`) when recording starts
3. Frontend POSTs blob to `/api/pipeline` with all settings as query parameters
4. Backend runs STT -> Translate -> TTS sequentially
5. Response includes original text, translated text, and base64 WAV audio
6. Frontend displays transcript and auto-plays audio (if enabled)

## GPU VRAM Management

When Ollama and Chatterbox share a GPU (e.g. RTX 2060 12GB):

- **Record start**: Ollama model preloaded via warmup endpoint (fire-and-forget)
- **Translation**: Ollama uses `keep_alive: "30s"` to unload quickly after use
- **TTS**: Chatterbox stays loaded permanently
- **OpenAI translation**: No Ollama needed, Chatterbox has full GPU

## Frontend Architecture

- `App.tsx` -- Layout shell with page routing, settings state management
- `pages/Home.tsx` -- State machine (idle → recording → processing → result/error), keyboard shortcuts
- `pages/Settings.tsx` -- Provider config, voice management, synthesis parameters, backend info (active providers only)
- `components/` -- Reusable UI components built on ink-ui
  - `PipelineRecorder.tsx` -- Record with timer, auto-process on stop, auto-start for "new recording"
  - `TranscriptDisplay.tsx` -- Original + translated text with copy-to-clipboard
  - `SpeakButton.tsx` -- Audio playback with playing state and download
  - `ResultActions.tsx` -- Retry pipeline, new recording
  - `ErrorCard.tsx` -- Error display with retry action
  - `VoiceRecorder.tsx` -- Browser microphone recording with preview (used by ChatterboxVoiceManager)
  - `ChatterboxVoiceManager.tsx` -- Voice upload, recording, deletion
  - `SearchSelect.tsx` -- Filterable dropdown for voices/models
- `hooks/` -- `useVoiceRecorder` (timer, preview), `useSettings` (localStorage), `useClipboard` (copy feedback), `useKeyboardShortcut` (Space to record)
- `api/inkonnect.ts` -- Typed fetch wrapper for all backend endpoints

## Backend Structure

```
backend/
├── main.py              # FastAPI app, lifespan, router mounting
├── config.py            # Pydantic Settings (env-based)
├── dependencies.py      # Global provider singletons
├── resolver.py          # Shared resolve_tts() / resolve_translate()
├── models.py            # Request/Response Pydantic models
├── providers/
│   ├── base.py          # ABCs: STTProvider, TTSProvider, TranslateProvider
│   ├── __init__.py      # Factory functions
│   ├── stt/
│   ├── tts/
│   └── translate/
├── routers/             # /api/* endpoints (frontend)
│   ├── stt.py
│   ├── tts.py
│   ├── translate.py
│   ├── pipeline.py
│   └── config.py
└── gateway/             # /v1/* endpoints (external clients)
    ├── router.py        # All gateway endpoints
    ├── auth.py          # API key authentication
    ├── rate_limit.py    # Token bucket rate limiter
    └── models.py        # Gateway-specific models
```
