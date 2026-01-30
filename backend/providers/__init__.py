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
    raise ValueError(f"Unknown TTS provider: {settings.tts_provider}")


def create_translate(settings: Settings) -> TranslateProvider:
    if settings.translate_provider == "local":
        from backend.providers.translate.ollama_local import OllamaLocalProvider
        return OllamaLocalProvider(
            model=settings.ollama_model,
            base_url=settings.ollama_url,
        )
    raise ValueError(f"Unknown translate provider: {settings.translate_provider}")
