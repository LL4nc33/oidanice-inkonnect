# Configuration

All settings are configured via environment variables. Copy `.env.example` to `.env` and adjust as needed.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEVICE` | `auto` | Compute device: `auto`, `cpu`, `cuda` |
| `STT_PROVIDER` | `local` | Speech-to-text provider |
| `WHISPER_MODEL` | `small` | Whisper model size: `tiny`, `base`, `small`, `medium`, `large-v3` |
| `WHISPER_COMPUTE_TYPE` | `int8` | Quantization: `int8`, `float16`, `float32` |
| `TTS_PROVIDER` | `local` | Text-to-speech provider: `local` (Piper), `chatterbox`, `elevenlabs` |
| `PIPER_VOICE` | `de_DE-thorsten-high` | Piper voice identifier |
| `CHATTERBOX_URL` | `http://gpu00.node:4123` | Chatterbox TTS API URL |
| `CHATTERBOX_VOICE` | `default` | Default Chatterbox voice name |
| `TRANSLATE_PROVIDER` | `local` | Translation provider: `local` (Ollama), `openai`, `deepl` |
| `OLLAMA_MODEL` | `ministral:3b` | Ollama model for translation |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API URL |
| `ELEVENLABS_API_KEY` | - | ElevenLabs API key |
| `ELEVENLABS_MODEL` | `eleven_multilingual_v2` | ElevenLabs model ID |
| `ELEVENLABS_VOICE_ID` | - | Default ElevenLabs voice ID |
| `DEEPL_API_KEY` | - | DeepL API key |
| `DEEPL_FREE` | `true` | Use DeepL Free tier (`true`) or Pro tier (`false`) |

## Frontend Settings

These settings are configured in the UI and stored in the browser's localStorage. They override backend defaults at runtime:

| Setting | Description |
|---------|-------------|
| TTS Provider | Switch between Piper (local), Chatterbox (remote), and ElevenLabs (cloud) |
| Chatterbox URL | Override backend Chatterbox API URL |
| Chatterbox Voice | Select from uploaded voice samples |
| Synthesis Parameters | Exaggeration (0.25-2.0), cfg_weight (0.0-1.0), temperature (0.05-5.0) |
| Ollama URL | Override backend Ollama URL |
| Ollama Model | Select from available models |
| Translation Provider | Switch between Ollama (local), OpenAI-compatible (remote), and DeepL (cloud) |
| OpenAI URL / Key / Model | For OpenAI-compatible translation (e.g. OpenRouter) |
| DeepL API Key | API key for DeepL translation |
| DeepL Tier | Free or Pro tier selection |
| ElevenLabs API Key | API key for ElevenLabs TTS |
| ElevenLabs Voice | SearchSelect from available ElevenLabs voices |
| ElevenLabs Model | Multilingual v2 or Turbo v2.5 |
| ElevenLabs Stability | Voice stability slider (0.0-1.0) |
| ElevenLabs Similarity | Voice similarity boost slider (0.0-1.0) |
| Auto-Play | Automatically play translation audio after pipeline completes |

## Model Sizes (Whisper)

| Model | VRAM/RAM | Relative Speed |
|-------|----------|---------------|
| `tiny` | ~1 GB | Fastest |
| `base` | ~1 GB | Fast |
| `small` | ~2 GB | Balanced |
| `medium` | ~5 GB | Accurate |
| `large-v3` | ~10 GB | Most accurate |

## GPU VRAM Management

When Ollama and Chatterbox share a GPU:

- Ollama models are preloaded when recording starts (fire-and-forget warmup)
- `keep_alive: "30s"` ensures Ollama unloads quickly after translation
- Chatterbox stays loaded permanently
- When using OpenAI-compatible translation or DeepL, no Ollama VRAM is used

## Benchmarks

Pipeline runs are automatically logged to `benchmarks/YYYY-MM-DD.jsonl` (gitignored). Each line contains per-step timing (`stt_ms`, `translate_ms`, `tts_ms`), provider info, and language pair.

Generate a Markdown report from benchmark logs:

```bash
python tools/benchmark_report.py benchmarks/2025-01-15.jsonl
```
