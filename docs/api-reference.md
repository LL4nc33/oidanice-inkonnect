# API Reference

Base URL: `http://localhost:8000/api`

## POST /api/stt

Transcribe audio to text.

```bash
curl -X POST http://localhost:8000/api/stt \
  -F "file=@recording.wav" \
  -F "language=de"
```

**Response:**
```json
{
  "text": "Hallo, wie geht es dir?",
  "detected_language": "de",
  "duration_ms": 1234
}
```

## POST /api/tts

Synthesize text to audio. Supports Piper (default), Chatterbox, and ElevenLabs.

```bash
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "lang": "en",
    "tts_provider": "chatterbox",
    "voice": "Lance",
    "chatterbox_url": "http://gpu00.node:4123",
    "exaggeration": 0.5,
    "cfg_weight": 0.5,
    "temperature": 0.8
  }'
```

**Response:**
```json
{
  "audio": "<base64-encoded audio>",
  "audio_format": "wav",
  "duration_ms": 567
}
```

`audio_format` is `"wav"` for Piper/Chatterbox or `"mp3"` for ElevenLabs.

## POST /api/translate

Translate text between languages.

```bash
curl -X POST http://localhost:8000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hallo Welt", "source": "de", "target": "en"}'
```

**Response:**
```json
{
  "text": "Hello World",
  "duration_ms": 890
}
```

## POST /api/pipeline

Full pipeline: STT -> Translate -> TTS.

```bash
curl -X POST "http://localhost:8000/api/pipeline?target_lang=en&tts=true&voice=Lance&tts_provider=chatterbox&chatterbox_url=http://gpu00.node:4123" \
  -F "file=@recording.wav"
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source_lang` | string | auto | Source language (auto-detected if omitted) |
| `target_lang` | string | `en` | Target language |
| `tts` | bool | `true` | Enable TTS output |
| `voice` | string | - | Voice name (Piper or Chatterbox) |
| `tts_provider` | string | - | TTS provider: `chatterbox`, `elevenlabs` |
| `chatterbox_url` | string | - | Override Chatterbox API URL |
| `ollama_url` | string | - | Override Ollama API URL |
| `model` | string | - | Translation model name |
| `provider` | string | - | Translation provider: `openai`, `deepl` |
| `api_url` | string | - | OpenAI-compatible API URL |
| `api_key` | string | - | API key (OpenAI-compatible or DeepL) |
| `deepl_free` | bool | `true` | Use DeepL Free tier |
| `exaggeration` | float | - | Chatterbox exaggeration (0.25-2.0) |
| `cfg_weight` | float | - | Chatterbox cfg_weight (0.0-1.0) |
| `temperature` | float | - | Chatterbox temperature (0.05-5.0) |
| `elevenlabs_key` | string | - | ElevenLabs API key |
| `elevenlabs_voice_id` | string | - | ElevenLabs voice ID |
| `elevenlabs_model` | string | - | ElevenLabs model (`eleven_multilingual_v2`, `eleven_turbo_v2_5`) |
| `elevenlabs_stability` | float | - | ElevenLabs voice stability (0.0-1.0) |
| `elevenlabs_similarity` | float | - | ElevenLabs similarity boost (0.0-1.0) |

**Response:**
```json
{
  "original_text": "Hallo, wie geht es dir?",
  "detected_language": "de",
  "translated_text": "Hello, how are you?",
  "audio": "<base64-encoded audio>",
  "audio_format": "wav",
  "duration_ms": 3456,
  "stt_ms": 1200,
  "translate_ms": 890,
  "tts_ms": 1366
}
```

`audio_format` is `"wav"` for Piper/Chatterbox or `"mp3"` for ElevenLabs. Per-step timing fields (`stt_ms`, `translate_ms`, `tts_ms`) are always included; `tts_ms` is `null` when `tts=false`.

## GET /api/config

Get current backend provider configuration.

```bash
curl http://localhost:8000/api/config
```

**Response:**
```json
{
  "stt_provider": "local",
  "tts_provider": "local",
  "translate_provider": "local",
  "device": "auto",
  "whisper_model": "small",
  "piper_voice": "de_DE-thorsten-high",
  "ollama_model": "ministral:3b",
  "chatterbox_url": "http://gpu00.node:4123",
  "chatterbox_voice": "default"
}
```

## GET /api/piper/voices

List installed Piper voices.

## POST /api/piper/voices/download

Download a Piper voice from HuggingFace.

```bash
curl -X POST http://localhost:8000/api/piper/voices/download \
  -H "Content-Type: application/json" \
  -d '{"voice": "en_US-lessac-high"}'
```

## GET /api/chatterbox/voices

List available Chatterbox voices.

```bash
curl "http://localhost:8000/api/chatterbox/voices?url=http://gpu00.node:4123"
```

## POST /api/chatterbox/voices

Upload a voice sample for voice cloning.

```bash
curl -X POST "http://localhost:8000/api/chatterbox/voices?url=http://gpu00.node:4123" \
  -F "file=@voice.wav" \
  -F "name=my-voice" \
  -F "language=de"
```

## DELETE /api/chatterbox/voices/{name}

Delete a Chatterbox voice.

## GET /api/chatterbox/languages

List supported Chatterbox languages.

## GET /api/elevenlabs/voices

List available ElevenLabs voices for a given API key.

```bash
curl "http://localhost:8000/api/elevenlabs/voices?key=YOUR_API_KEY"
```

**Response:**
```json
{
  "voices": [
    {"id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel"},
    {"id": "AZnzlk1XvdvUeBnXmlld", "name": "Domi"}
  ]
}
```

Returns `{"voices": []}` if the key is empty or invalid.

## GET /api/ollama/models

List available Ollama models.

## GET /api/openai/models

List available OpenAI-compatible models.

## POST /api/gpu/warmup

Preload an Ollama model into VRAM.

```bash
curl -X POST "http://localhost:8000/api/gpu/warmup?service=ollama"
```

## GET /api/gpu/status

Get GPU memory status for Ollama and Chatterbox.
