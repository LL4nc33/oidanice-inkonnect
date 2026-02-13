# inkonnect

<p align="center">
  <img src="frontend/public/favicon.svg" alt="inkonnect" width="64" height="64" />
</p>

<p align="center">
  <strong>Accessible communication PWA.</strong><br>
  Speak in your language, get text and audio in another. Local, private, CPU-first.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.3.1-black?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/docker-compose-black?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/whisper-AI-black?style=flat-square" alt="Whisper" />
  <img src="https://img.shields.io/badge/PWA-installable-black?style=flat-square" alt="PWA" />
  <img src="https://img.shields.io/badge/license-AGPL--3.0-black?style=flat-square" alt="License" />
</p>

---

## Features

- **Full pipeline** -- record, transcribe, translate, and speak back in one step
- **API Gateway** -- OpenAI-compatible `/v1/*` API for external clients with auth and rate limiting
- **Speech-to-Text** -- faster-whisper with automatic language detection for 99 languages
- **Text-to-Speech** -- Piper TTS (CPU) and Chatterbox TTS (GPU) with voice cloning
- **Voice cloning** -- record or upload voice samples, manage voices, 22 supported languages
- **Synthesis control** -- adjustable exaggeration, cfg_weight, and temperature for Chatterbox
- **Auto-play** -- translation audio plays automatically after pipeline completes (configurable)
- **Smart GPU management** -- Ollama preloading on record start, automatic VRAM cleanup
- **Translation** -- Ollama LLM or OpenAI-compatible APIs (OpenRouter, etc.)
- **Neobrutalism UI** -- monochrome design with offset shadows, dark mode, serif typography
- **Recording UX** -- live timer, auto-process on stop, copy text, download audio, retry pipeline
- **Keyboard shortcuts** -- Space bar to start/stop recording
- **Installable PWA** -- add to home screen on mobile with browser-specific install prompts
- **Provider pattern** -- swap local and cloud providers at runtime from the frontend
- **One-command setup** -- Docker Compose brings up all services in seconds

---

## Screenshots

| Light Mode | Dark Mode |
|:---:|:---:|
| ![Light Mode](docs/screenshots/light.png) | ![Dark Mode](docs/screenshots/dark.png) |

---

## Quick Start

```bash
git clone https://github.com/LL4nc33/oidanice-inkonnect.git
cd oidanice-inkonnect
cp .env.example .env
docker compose up -d

# Pull Ollama model (one-time)
docker compose exec ollama ollama pull ministral:3b
```

Open [http://localhost:8000](http://localhost:8000) and start recording.

---

## Gateway API

The gateway exposes an OpenAI-compatible API under `/v1/*` for external clients:

```bash
# Text-to-Speech
curl -X POST http://localhost:8000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "Hallo Welt", "model": "piper", "voice": "de_DE-thorsten-high"}' \
  -o output.wav

# Speech-to-Text
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F "file=@recording.webm" -F "model=whisper-small"

# Full Pipeline (STT -> Translate -> TTS)
curl -X POST http://localhost:8000/v1/pipeline \
  -F "file=@recording.webm" -F "target_lang=en" -F "tts=true"

# Service Discovery
curl http://localhost:8000/v1/health
curl http://localhost:8000/v1/models
curl http://localhost:8000/v1/voices
curl http://localhost:8000/v1/languages
```

Auth and rate limiting are configurable via `GATEWAY_API_KEYS` and `GATEWAY_RATE_LIMIT` env vars.

---

## Documentation

| Topic | Description |
|-------|-------------|
| [Architecture](docs/architecture.md) | System diagram, provider pattern, data flow |
| [Configuration](docs/configuration.md) | Environment variables, provider selection |
| [API Reference](docs/api-reference.md) | REST endpoints and curl examples |
| [Development](docs/development.md) | Local backend/frontend setup |
| [System Requirements](docs/system-requirements.md) | CPU/GPU/RAM requirements |
| [Roadmap](ROADMAP.md) | Planned features and future ideas |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI | @oidanice/ink-ui |
| Backend | FastAPI, Python 3.11 |
| STT | faster-whisper (CTranslate2) |
| TTS | Piper TTS, Chatterbox TTS |
| Translation | Ollama, OpenAI-compatible |
| Infrastructure | Docker Compose |

---

Built by [OidaNice](https://github.com/LL4nc33) -- powered by faster-whisper, piper, chatterbox & ollama -- v0.3.1
