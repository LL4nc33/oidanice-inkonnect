from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    device: str = "auto"

    # STT
    stt_provider: str = "local"
    whisper_model: str = "small"
    whisper_compute_type: str = "int8"

    # TTS
    tts_provider: str = "local"
    piper_voice: str = "de_DE-thorsten-high"
    chatterbox_url: str = "http://gpu00.node:4123"
    chatterbox_voice: str = "default"

    # Translate
    translate_provider: str = "local"
    ollama_model: str = "ministral-3:3b"
    ollama_url: str = "http://localhost:11434"

    # OpenAI-compatible translation
    openai_compat_url: str = ""
    openai_compat_model: str = ""

    # Optional cloud keys
    openai_api_key: str | None = None
    elevenlabs_api_key: str | None = None
    deepl_api_key: str | None = None

    model_config = {"env_file": ".env"}
