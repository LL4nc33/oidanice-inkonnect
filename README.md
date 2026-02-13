# inkonnect

<p align="center">
  <img src="frontend/public/favicon.svg" alt="inkonnect" width="64" height="64" />
</p>

<p align="center">
  <strong>Accessible communication PWA.</strong><br>
  Speak in your language, get text and audio in another. Local, private, CPU-first.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.4-black?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/docker-compose-black?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/whisper-AI-black?style=flat-square" alt="Whisper" />
  <img src="https://img.shields.io/badge/PWA-installable-black?style=flat-square" alt="PWA" />
  <img src="https://img.shields.io/badge/license-AGPL--3.0-black?style=flat-square" alt="License" />
</p>

---

## Features

- **Full pipeline** -- record, transcribe, translate, and speak back in one step
- **Speech-to-Text** -- faster-whisper with automatic language detection for 99 languages
- **Text-to-Speech** -- Piper TTS (local) and Chatterbox TTS (remote GPU) with voice cloning
- **Translation** -- Ollama LLM or OpenAI-compatible APIs, GDPR-compliant
- **Ink-inspired UI** -- monochrome design with dark mode, serif typography, no distractions
- **Installable PWA** -- add to home screen on mobile with browser-specific install prompts
- **Provider pattern** -- swap local and cloud providers interchangeably
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
| Backend | FastAPI, Python 3.12 |
| STT | faster-whisper (CTranslate2) |
| TTS | Piper TTS, Chatterbox TTS |
| Translation | Ollama, OpenAI-compatible |
| Infrastructure | Docker Compose |

---

Built by [OidaNice](https://github.com/LL4nc33) -- powered by faster-whisper -- v0.1.4
