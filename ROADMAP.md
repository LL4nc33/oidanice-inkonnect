# Roadmap

## v0.1 -- Core (done)

- [x] Speech-to-Text (faster-whisper)
- [x] Text-to-Speech (Piper, local CPU)
- [x] Translation (Ollama)
- [x] Full Pipeline endpoint
- [x] React PWA with ink-ui
- [x] Docker Compose deployment

## v0.2 -- Voice Cloning & GPU Management (done)

- [x] Chatterbox TTS integration (remote GPU)
- [x] Voice cloning -- record in browser or upload audio files
- [x] Voice management -- list, upload, delete voices
- [x] Synthesis parameters (exaggeration, cfg_weight, temperature)
- [x] 22 languages for Chatterbox voices
- [x] OpenAI-compatible translation (OpenRouter, etc.)
- [x] Runtime provider switching from frontend
- [x] Smart VRAM management (Ollama preloading, keep_alive, auto-unload)
- [x] GPU status monitoring (Ollama + Chatterbox)
- [x] Configurable Chatterbox and Ollama URLs from frontend
- [x] Auto-play translation audio (configurable)
- [x] Piper voice download from HuggingFace

## v0.3 -- API Gateway (done)

- [x] OpenAI-compatible `/v1/audio/transcriptions` (STT)
- [x] OpenAI-compatible `/v1/audio/speech` (TTS, raw WAV)
- [x] `/v1/translate` (text translation)
- [x] `/v1/pipeline` (full STT -> Translate -> TTS, JSON or raw audio)
- [x] `/v1/models` (OpenAI-format model list)
- [x] `/v1/health` (provider status with latency)
- [x] `/v1/voices` and `/v1/languages` (service discovery)
- [x] API key authentication (Bearer / X-API-Key)
- [x] In-memory token bucket rate limiting
- [x] Shared resolver (DRY provider resolution)
- [x] Chatterbox multilingual support (language_id)

## v0.3.1 -- UX Overhaul (done)

- [x] Recording timer (live duration display)
- [x] Auto-process on stop (no extra "process" click)
- [x] New recording starts recording immediately
- [x] Copy-to-clipboard for original text and translation
- [x] Audio playback state indicator (playing/idle)
- [x] Audio download button
- [x] Retry pipeline without re-recording
- [x] Error card with retry action
- [x] Keyboard shortcut: Space to start/stop recording
- [x] aria-live regions for screen reader announcements
- [x] Neobrutalism design: offset shadows, 2px borders, primary button variant
- [x] Shadow variable (--shadow) for visible depth on all backgrounds
- [x] Backend info shows only active providers
- [x] GPU status uses frontend-configured URLs
- [x] Removed local/remote labels from provider dropdowns

## v0.3.2 -- Settings Dashboard (done)

- [x] Settings page redesign (521 -> 248 lines, modular components)
- [x] Provider Status Grid (online/offline/unconfigured badges)
- [x] GPU Monitor (Ollama models + Chatterbox VRAM)
- [x] Cloud Usage (DeepL/ElevenLabs quota progress bars)
- [x] Benchmark Widget (last 10 pipeline runs + averages)
- [x] FilterChip navigation with IntersectionObserver
- [x] Backend: /api/health, /api/benchmarks/recent, /api/deepl/usage, /api/elevenlabs/usage
- [x] DeepL translation provider
- [x] ElevenLabs TTS provider
- [x] Pipeline benchmark logging (JSONL per day)
- [x] Configurable Ollama keep_alive and context length

## v0.4 -- Production

- [ ] End-to-end testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Chatterbox Turbo support (paralinguistic tags, emotions)
- [ ] Streaming TTS (chunked audio playback)

## v0.5 -- Chat History & Semantic Search

- [ ] PostgreSQL + pgvector container (pgvector/pgvector:pg16)
- [ ] Database layer (asyncpg + SQLAlchemy async ORM + Alembic migrations)
- [ ] Session CRUD endpoints (/api/sessions)
- [ ] Message history with pagination (/api/sessions/{id}/messages)
- [ ] Pipeline integration (auto-save messages with session_id)
- [ ] Hybrid audio storage (Opus-compressed, optional per session)
- [ ] User-configurable retention policies (24h / 7d / 30d / 1y / unlimited)
- [ ] Background cleanup job (expired sessions + audio files)
- [ ] Embedding provider (nomic-embed-text via Ollama, CPU)
- [ ] Semantic search across all sessions (/api/search via pgvector)
- [ ] Chat history UI (Messenger-style, original + translation per turn)
- [ ] Gateway endpoints for sessions/search (/v1/)
- [ ] See: docs/plans/CHAT-HISTORY-PLAN.md

## v0.6 -- Industry Profiles

- [ ] Profile registry (medical, ngo, hotel, government, retail, education)
- [ ] Domain-specific system prompts for translation LLM
- [ ] System prompt injection in Ollama + OpenAI-compat providers
- [ ] Profile Switcher in Settings (card grid)
- [ ] Quick Language Chips on Home page (per-profile language pairs)
- [ ] Profile badge indicator on Home page
- [ ] Pipeline integration (profile_id → system_prompt → translator)
- [ ] Session/Message profile_id tracking
- [ ] Gateway: /v1/profiles + profile_id in /v1/pipeline
- [ ] See: docs/plans/INDUSTRY-PROFILES-PLAN.md

## v0.7 -- Rebrand & UI Redesign

- [ ] Register dolmtschr.com + dolmtschr.at domains
- [ ] Codebase rebrand (dolmtschr → dolmtschr)
- [ ] Big Record Button (animated, centered, mic icon)
- [ ] Language Selector with flags + swap animation
- [ ] Audio Waveform Visualizer (real-time recording feedback)
- [ ] Chat Bubble layout (replaces TranscriptDisplay)
- [ ] Auto-Session (first recording auto-creates session)
- [ ] Quick Language Chips (profile-aware)
- [ ] Split-Screen / Two-Person Mode (face-to-face)
- [ ] Walkie-Talkie hold-to-talk mode
- [ ] Quick Phrases per profile
- [ ] Service Status indicator in header
- [ ] Brand assets (logo, favicon, PWA icons, OG image)
- [ ] See: docs/plans/REBRAND-PLAN.md, docs/plans/UI-REDESIGN-PLAN.md

## v0.8 -- Enhanced

- [ ] Conversation mode (continuous recording)
- [ ] WebSocket streaming for real-time transcription
- [ ] Offline mode with cached models
- [ ] Multi-user support
