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
                           ┌─────▼──┐ ┌─▼────┐ ┌▼───────┐ ┌──────────┐
                           │Whisper │ │Piper │ │ Ollama  │ │PostgreSQL│
                           │  (CPU) │ │(CPU) │ │ (GPU)   │ │+pgvector │
                           └────────┘ └──┬───┘ └───┬────┘ └──────────┘
                                      ┌──▼────────┐┌▼──────┐
                                      │Chatterbox ││ DeepL  │
                                      │  (GPU)    ││(cloud) │
                                      └───────────┘└────────┘
                                      ┌──▼──────────┐
                                      │ ElevenLabs  │
                                      │  (cloud)    │
                                      └─────────────┘

### Translation Model Benchmark Results

| Model | Speed | Accuracy | VRAM | Role |
|-------|-------|----------|------|------|
| gemma3:4b | 7/10 | 9/10 | 3.3 GB | Default |
| ministral-3:3b | 9/10 | 8/10 | 3.0 GB | Fallback / Low-VRAM |
| qwen3:4b | 3/10 | 7.5/10 | 2.5 GB | NGO (Farsi/Dari/Somali, 119 langs) |
| llama3.2:3b | 9/10 | 6/10 | 2.0 GB | Rejected – too inaccurate |

### Production Stack (RTX 2060 6GB)

| Component | Model | Runs On | Resource |
|-----------|-------|---------|----------|
| STT | faster-whisper (small) | CPU | RAM |
| Translation | gemma3:4b | GPU | 3.3 GB VRAM |
| TTS | Chatterbox (23 langs) | GPU | ~3 GB VRAM |
| Embeddings | nomic-embed-text | CPU | ~300 MB RAM |
| Database | PostgreSQL 16 + pgvector | CPU | minimal |
| **GPU Total** | | | **~6.3 GB** |
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
- `providers/tts/elevenlabs_remote.py` -- ElevenLabs TTS (cloud)
- `providers/translate/ollama_local.py` -- Ollama LLM (GPU)
- `providers/translate/openai_compat.py` -- OpenAI-compatible APIs (remote)
- `providers/translate/deepl_remote.py` -- DeepL Translation (cloud)

Factory functions in `providers/__init__.py` create the correct provider based on `config.py` settings.

### Runtime Provider Switching

The shared resolver in `backend/resolver.py` handles runtime switching. Both `/api/*` and `/v1/*` routers use it:

```python
def resolve_tts(tts_provider, voice, chatterbox_url=None,
                elevenlabs_key=None, elevenlabs_voice_id=None, ...):
    if tts_provider == "chatterbox":
        return ChatterboxRemoteProvider(base_url=...), True
    if tts_provider == "elevenlabs":
        return ElevenLabsRemoteProvider(api_key=...), True
    return get_tts(), False  # singleton

def resolve_translate(provider, api_url, api_key, model,
                      ollama_url=None, deepl_free=True):
    if provider == "openai" and api_url:
        return OpenAICompatProvider(...), True
    if provider == "deepl" and api_key:
        return DeepLRemoteProvider(api_key=api_key, free=deepl_free), True
    ...
```

Ad-hoc providers are always cleaned up in a `finally` block.

## Data Flow: Full Pipeline

1. User records audio in browser (MediaRecorder API -> WebM/Opus Blob)
2. Frontend sends fire-and-forget warmup request (`POST /api/gpu/warmup`) when recording starts
3. Frontend POSTs blob to `/api/pipeline` with all settings as query parameters
4. Backend runs STT -> Translate -> TTS sequentially
5. Response includes original text, translated text, base64 audio, per-step timing (`stt_ms`, `translate_ms`, `tts_ms`), and `audio_format` (wav or mp3)
6. Frontend displays transcript with timing breakdown and auto-plays audio (if enabled)
7. Pipeline logs timing data to `benchmarks/YYYY-MM-DD.jsonl` for performance analysis

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
  - `TranscriptDisplay.tsx` -- Original + translated text with copy-to-clipboard, per-step timing display
  - `SpeakButton.tsx` -- Audio playback with playing state and download (supports WAV and MP3 via `audio_format`)
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
