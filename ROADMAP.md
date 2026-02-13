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

## v0.4 -- Production

- [ ] End-to-end testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Chatterbox Turbo support (paralinguistic tags, emotions)
- [ ] Streaming TTS (chunked audio playback)

## v0.5 -- Enhanced

- [ ] Conversation mode (continuous recording)
- [ ] WebSocket streaming for real-time transcription
- [ ] Transcript history / export
- [ ] Offline mode with cached models
- [ ] Multi-user support
