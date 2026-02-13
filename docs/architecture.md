# Architecture

## System Overview

```
┌─────────────┐     ┌──────────────────────────────────┐
│   Browser    │────>│         FastAPI Backend           │
│  React PWA   │<────│                                  │
└─────────────┘     │  ┌─────────┐  ┌──────────────┐   │
                    │  │ Routers │  │ Dependencies  │   │
                    │  └────┬────┘  └──────┬───────┘   │
                    │       │              │            │
                    │  ┌────▼──────────────▼────────┐   │
                    │  │    Provider Abstraction     │   │
                    │  │    Layer                    │   │
                    │  └──┬────────┬────────┬───────┘   │
                    │     │        │        │           │
                    │  ┌──▼──┐ ┌──▼──┐ ┌──▼───────┐   │
                    │  │ STT │ │ TTS │ │Translate  │   │
                    │  └──┬──┘ └──┬──┘ └──┬───────┘   │
                    └─────┼───────┼───────┼────────────┘
                          │       │       │
                    ┌─────▼──┐ ┌─▼────┐ ┌▼───────┐
                    │Whisper │ │Piper │ │ Ollama  │
                    │  (CPU) │ │(CPU) │ │ (GPU)   │
                    └────────┘ └──────┘ └────────┘
                               ┌─▼──────────┐
                               │ Chatterbox  │
                               │ (GPU, remote)│
                               └─────────────┘
```

## Provider Pattern

Each AI capability (STT, TTS, Translation) is abstracted behind an interface in `backend/providers/base.py`. Concrete implementations live in subdirectories:

- `providers/stt/whisper_local.py` -- faster-whisper (CPU)
- `providers/tts/piper_local.py` -- Piper TTS (CPU, local)
- `providers/tts/chatterbox_remote.py` -- Chatterbox TTS (GPU, remote API)
- `providers/translate/ollama_local.py` -- Ollama LLM (GPU)
- `providers/translate/openai_compat.py` -- OpenAI-compatible APIs (remote)

Factory functions in `providers/__init__.py` create the correct provider based on `config.py` settings.

### Runtime Provider Switching

The frontend can override the backend default provider per request. Routers use `_resolve_tts()` and `_resolve_translate()` to create ad-hoc providers when the frontend requests a different provider than the singleton:

```python
def _resolve_tts(tts_provider, voice, chatterbox_url=None):
    if tts_provider == "chatterbox":
        return ChatterboxRemoteProvider(base_url=...), True  # ad-hoc
    return get_tts(), False  # singleton
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
- `pages/Home.tsx` -- Recording, pipeline, auto-play
- `pages/Settings.tsx` -- Provider config, voice management, synthesis parameters
- `components/` -- Reusable UI components built on ink-ui
  - `VoiceRecorder.tsx` -- Browser microphone recording with preview
  - `ChatterboxVoiceManager.tsx` -- Voice upload, recording, deletion
  - `SearchSelect.tsx` -- Filterable dropdown for voices/models
  - `SpeakButton.tsx` -- Audio playback with auto-play support
- `hooks/` -- Audio recording (`useAudioRecorder`), voice recording (`useVoiceRecorder`), settings persistence (`useSettings`)
- `api/inkonnect.ts` -- Typed fetch wrapper for all backend endpoints
