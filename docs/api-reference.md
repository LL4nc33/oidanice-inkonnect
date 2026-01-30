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

Synthesize text to audio.

```bash
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "lang": "en"}'
```

**Response:**
```json
{
  "audio": "<base64-encoded WAV>",
  "duration_ms": 567
}
```

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

Full pipeline: STT → Translate → TTS.

```bash
curl -X POST "http://localhost:8000/api/pipeline?target_lang=en&tts=true" \
  -F "file=@recording.wav"
```

**Response:**
```json
{
  "original_text": "Hallo, wie geht es dir?",
  "detected_language": "de",
  "translated_text": "Hello, how are you?",
  "audio": "<base64-encoded WAV>",
  "duration_ms": 3456
}
```

## GET /api/config

Get current provider configuration.

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
  "ollama_model": "ministral:3b"
}
```
