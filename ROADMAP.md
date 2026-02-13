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

## v1.0 -- Production

- [ ] End-to-end testing
- [ ] Error recovery and retry logic
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Chatterbox Turbo support (paralinguistic tags, emotions)
- [ ] Streaming TTS (chunked audio playback)

## v2.0 -- Enhanced

- [ ] Conversation mode (continuous recording)
- [ ] WebSocket streaming for real-time transcription
- [ ] Transcript history / export
- [ ] Offline mode with cached models
- [ ] Multi-user support
