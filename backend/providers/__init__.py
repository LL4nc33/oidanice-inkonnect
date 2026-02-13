from backend.config import Settings
from backend.providers.base import STTProvider, TTSProvider, TranslateProvider


def create_stt(settings: Settings) -> STTProvider:
    if settings.stt_provider == "local":
        from backend.providers.stt.whisper_local import WhisperLocalProvider
        return WhisperLocalProvider(
            model_size=settings.whisper_model,
            device=settings.device,
            compute_type=settings.whisper_compute_type,
        )
    raise ValueError(f"Unknown STT provider: {settings.stt_provider}")


def create_tts(settings: Settings) -> TTSProvider:
    if settings.tts_provider == "local":
        from backend.providers.tts.piper_local import PiperLocalProvider
        return PiperLocalProvider(voice=settings.piper_voice)
    if settings.tts_provider == "chatterbox":
        from backend.providers.tts.chatterbox_remote import ChatterboxRemoteProvider
        return ChatterboxRemoteProvider(
            base_url=settings.chatterbox_url,
            voice=settings.chatterbox_voice,
        )
    if settings.tts_provider == "elevenlabs":
        from backend.providers.tts.elevenlabs_remote import ElevenLabsRemoteProvider
        return ElevenLabsRemoteProvider(
            api_key=settings.elevenlabs_api_key or "",
            model=settings.elevenlabs_model,
            voice_id=settings.elevenlabs_voice_id,
        )
    raise ValueError(f"Unknown TTS provider: {settings.tts_provider}")


def create_translate(settings: Settings) -> TranslateProvider:
    if settings.translate_provider == "local":
        from backend.providers.translate.ollama_local import OllamaLocalProvider
        return OllamaLocalProvider(
            model=settings.ollama_model,
            base_url=settings.ollama_url,
        )
    if settings.translate_provider == "openai":
        from backend.providers.translate.openai_compat import OpenAICompatProvider
        return OpenAICompatProvider(
            model=settings.openai_compat_model,
            base_url=settings.openai_compat_url,
            api_key=settings.openai_api_key or "",
        )
    if settings.translate_provider == "deepl":
        from backend.providers.translate.deepl_remote import DeepLRemoteProvider
        return DeepLRemoteProvider(
            api_key=settings.deepl_api_key or "",
            free=settings.deepl_free,
        )
    raise ValueError(f"Unknown translate provider: {settings.translate_provider}")
