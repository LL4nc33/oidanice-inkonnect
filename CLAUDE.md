# inkonnect

## Projekt
Barrierefreie Kommunikations-PWA: Sprache ↔ Text ↔ Sprache mit optionaler Übersetzung.

## Tech Stack
- Frontend: Vite + React 18 + TypeScript + @oidanice/ink-ui
- Backend: FastAPI + faster-whisper + Piper TTS + Chatterbox TTS + Ollama

## Struktur
- `ink-ui/` - @oidanice/ink-ui Design System (lokaler Klon, wird per `npm run build` gebaut)
- `frontend/` - React PWA mit ink-ui
  - `src/api/` - API-Client (`inkonnect.ts`)
  - `src/hooks/` - Custom Hooks (`useSettings.ts`, `useVoiceRecorder.ts`, `useClipboard.ts`, `useKeyboardShortcut.ts`)
  - `src/pages/` - Seiten (`Home.tsx`, `Settings.tsx`)
  - `src/components/` - UI-Komponenten (`PipelineRecorder`, `TranscriptDisplay`, `SpeakButton`, `ErrorCard`, `ResultActions`)
- `backend/` - FastAPI mit Provider Abstraction Layer
  - `providers/base.py` - ABCs: `STTProvider`, `TTSProvider`, `TranslateProvider`
  - `providers/__init__.py` - Factory-Funktionen: `create_stt()`, `create_tts()`, `create_translate()`
  - `providers/tts/` - TTS Implementierungen (Piper lokal, Chatterbox remote)
  - `providers/stt/` - STT Implementierungen (Whisper lokal)
  - `providers/translate/` - Translation Implementierungen (Ollama, OpenAI-compat)
  - `routers/` - API-Endpoints (`tts.py`, `pipeline.py`, `config.py`)
  - `dependencies.py` - Singleton-Provider + Settings
  - `config.py` - Pydantic Settings (env-basiert)
  - `models.py` - Request/Response Models
- `models/` - Auto-download, gitignored

## Architektur-Patterns
- **Provider Abstraction**: Neue Provider implementieren ABC, Factory in `providers/__init__.py` registrieren
- **Runtime Provider Switching**: Ad-hoc Provider via `_resolve_tts()` / `_resolve_translate()` in Routern (Frontend sendet Provider-Typ per Request)
- **Singleton + Ad-hoc**: Startup-Provider als Default-Singleton, Frontend kann per Request einen anderen Provider anfordern
- **Settings-Flow**: `useSettings` Hook -> localStorage -> Props durch App -> API-Calls mit Settings als Parameter

## Coding Standards
- TypeScript strict, keine `any`
- Python type hints ueberall
- Komponenten < 100 Zeilen (groessere Logik in eigene Komponenten extrahieren)
- ink-ui fuer alles UI (`Card`, `Select`, `Input`, `Button`, `Divider`, `Progress`)
- Code modular: JS in eigene Dateien, CSS/HTML ebenso
- Backend: `httpx.AsyncClient` fuer HTTP-Calls, Pydantic fuer Models
- Error Handling: Strukturierte Responses statt Exceptions an den Client

## Agent-Delegation (CWE)
- **cwe:builder** fuer Implementation, Bug-Fixes, Code-Aenderungen
- **cwe:architect** fuer Systemdesign, API-Design, ADRs
- **cwe:quality** fuer Tests, Coverage, Code-Health
- **cwe:security** fuer Security-Audits, Input-Validierung
- **cwe:researcher** fuer Codebase-Analyse, Dokumentation
- **cwe:ask** fuer Fragen und Erklaerungen (READ-ONLY)

## Docker
```bash
docker compose up -d
```
