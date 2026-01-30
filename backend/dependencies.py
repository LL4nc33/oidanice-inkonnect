"""Global provider instances, initialized at app startup."""

from backend.config import Settings
from backend.providers.base import STTProvider, TTSProvider, TranslateProvider

_settings: Settings | None = None
_stt: STTProvider | None = None
_tts: TTSProvider | None = None
_translate: TranslateProvider | None = None


def init_providers(settings: Settings, stt: STTProvider, tts: TTSProvider, translate: TranslateProvider) -> None:
    global _settings, _stt, _tts, _translate
    _settings = settings
    _stt = stt
    _tts = tts
    _translate = translate


def get_settings() -> Settings:
    assert _settings is not None, "Settings not initialized"
    return _settings


def get_stt() -> STTProvider:
    assert _stt is not None, "STT provider not initialized"
    return _stt


def get_tts() -> TTSProvider:
    assert _tts is not None, "TTS provider not initialized"
    return _tts


def get_translate() -> TranslateProvider:
    assert _translate is not None, "Translate provider not initialized"
    return _translate
