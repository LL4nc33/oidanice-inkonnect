# inkonnect

## Projekt
Barrierefreie Kommunikations-PWA: Sprache ↔ Text ↔ Sprache mit optionaler Übersetzung.

## Tech Stack
- Frontend: Vite + React 18 + TypeScript + @oidanice/ink-ui
- Backend: FastAPI + faster-whisper + Piper TTS + Ollama

## Struktur
- `frontend/` - React PWA mit ink-ui
- `backend/` - FastAPI mit Provider Abstraction Layer
- `models/` - Auto-download, gitignored

## Coding Standards
- TypeScript strict, keine `any`
- Python type hints überall
- Komponenten < 100 Zeilen
- ink-ui für alles UI
- Code modular: JS in eigene Dateien, CSS/HTML ebenso

## Docker
```bash
docker compose up -d
```
