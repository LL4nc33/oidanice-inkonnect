# Configuration

All settings are configured via environment variables. Copy `.env.example` to `.env` and adjust as needed.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEVICE` | `auto` | Compute device: `auto`, `cpu`, `cuda` |
| `STT_PROVIDER` | `local` | Speech-to-text provider |
| `WHISPER_MODEL` | `small` | Whisper model size: `tiny`, `base`, `small`, `medium`, `large-v3` |
| `WHISPER_COMPUTE_TYPE` | `int8` | Quantization: `int8`, `float16`, `float32` |
| `TTS_PROVIDER` | `local` | Text-to-speech provider |
| `PIPER_VOICE` | `de_DE-thorsten-high` | Piper voice identifier |
| `TRANSLATE_PROVIDER` | `local` | Translation provider |
| `OLLAMA_MODEL` | `ministral:3b` | Ollama model for translation |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API URL |

## Optional Cloud Keys

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI Whisper / ChatGPT (future) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS (future) |
| `DEEPL_API_KEY` | DeepL Translation (future) |

## Model Sizes (Whisper)

| Model | VRAM/RAM | Relative Speed |
|-------|----------|---------------|
| `tiny` | ~1 GB | Fastest |
| `base` | ~1 GB | Fast |
| `small` | ~2 GB | Balanced |
| `medium` | ~5 GB | Accurate |
| `large-v3` | ~10 GB | Most accurate |
