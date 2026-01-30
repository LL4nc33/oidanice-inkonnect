# inkonnect

Accessible communication PWA: Speech ↔ Text ↔ Speech with real-time translation.

Speak in your language, get text and audio in another. Local, private, CPU-first.

## Features

- **Speech-to-Text** – faster-whisper with automatic language detection
- **Text-to-Speech** – Piper TTS with natural-sounding voices
- **Translation** – Ollama LLM (local, GDPR-compliant)
- **Full Pipeline** – Record → Transcribe → Translate → Speak in one step
- **PWA** – Installable on mobile and desktop
- **Kindle UI** – Accessible, monochrome design with dark mode
- **Provider Pattern** – Swap local and cloud providers interchangeably

## Quick Start

```bash
# With Docker Compose
docker compose up -d

# Pull Ollama model (one-time)
docker compose exec ollama ollama pull ministral:3b
```

Open http://localhost:8000 in your browser.

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design and provider pattern |
| [Configuration](docs/configuration.md) | All environment variables |
| [API Reference](docs/api-reference.md) | Endpoints with curl examples |
| [Development](docs/development.md) | Local setup without Docker |
| [System Requirements](docs/system-requirements.md) | CPU/GPU/RAM requirements |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + kindle-ui |
| Backend | FastAPI + Python 3.12 |
| STT | faster-whisper (CTranslate2) |
| TTS | Piper TTS |
| Translation | Ollama (ministral:3b) |
| Infrastructure | Docker Compose |

## License

[AGPL-3.0](LICENSE)
