# Architecture

## System Overview

```
┌─────────────┐     ┌──────────────────────────────────┐
│   Browser    │────▶│         FastAPI Backend           │
│  React PWA   │◀────│                                  │
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
                    └────────┘ └──────┘ └────────┘
```

## Provider Pattern

Each AI capability (STT, TTS, Translation) is abstracted behind an interface in `backend/providers/base.py`. Concrete implementations live in subdirectories:

- `providers/stt/whisper_local.py` – faster-whisper
- `providers/tts/piper_local.py` – Piper TTS
- `providers/translate/ollama_local.py` – Ollama LLM

Factory functions in `providers/__init__.py` create the correct provider based on `config.py` settings.

## Data Flow: Full Pipeline

1. User records audio in browser (MediaRecorder API → WebM/Opus Blob)
2. Frontend POSTs blob to `/api/pipeline`
3. Backend runs STT → Translate → TTS sequentially
4. Response includes original text, translated text, and base64 WAV audio
5. Frontend displays transcript and plays audio

## Frontend Architecture

- `App.tsx` – Layout shell with page routing via `useState`
- `pages/Home.tsx` – Main recording + pipeline UI
- `pages/Settings.tsx` – Backend info display
- `components/` – Reusable UI components built on kindle-ui
- `hooks/` – Audio recording and settings persistence
- `api/` – Typed fetch wrapper for all backend endpoints
