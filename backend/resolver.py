"""Shared provider resolvers for runtime switching.

Routers use these to create ad-hoc providers when the frontend requests
a different provider/URL than the startup singleton.  Ad-hoc providers
must always be cleaned up in a ``finally`` block.
"""

from backend.dependencies import get_settings, get_tts, get_translate
from backend.providers.base import TTSProvider, TranslateProvider


def resolve_tts(
    tts_provider: str | None,
    voice: str | None,
    chatterbox_url: str | None = None,
    elevenlabs_key: str | None = None,
    elevenlabs_voice_id: str | None = None,
    elevenlabs_model: str | None = None,
    elevenlabs_stability: float | None = None,
    elevenlabs_similarity: float | None = None,
) -> tuple[TTSProvider, bool]:
    """Return (provider_instance, is_ad_hoc). Ad-hoc providers must be cleaned up."""
    if tts_provider == "chatterbox":
        from backend.providers.tts.chatterbox_remote import ChatterboxRemoteProvider

        s = get_settings()
        return ChatterboxRemoteProvider(
            base_url=chatterbox_url or s.chatterbox_url,
            voice=voice or s.chatterbox_voice,
        ), True
    if tts_provider == "elevenlabs":
        from backend.providers.tts.elevenlabs_remote import ElevenLabsRemoteProvider

        s = get_settings()
        return ElevenLabsRemoteProvider(
            api_key=elevenlabs_key or s.elevenlabs_api_key or "",
            model=elevenlabs_model or s.elevenlabs_model,
            voice_id=elevenlabs_voice_id or s.elevenlabs_voice_id,
        ), True
    singleton = get_tts()
    if singleton is None:
        raise RuntimeError("No TTS provider available")
    return singleton, False


def resolve_translate(
    provider: str | None,
    api_url: str | None,
    api_key: str | None,
    model: str | None,
    ollama_url: str | None = None,
    deepl_free: bool = True,
) -> tuple[TranslateProvider, bool]:
    """Return (provider_instance, is_ad_hoc). Ad-hoc providers must be cleaned up."""
    if provider == "openai" and api_url:
        from backend.providers.translate.openai_compat import OpenAICompatProvider

        return OpenAICompatProvider(
            model=model or "", base_url=api_url, api_key=api_key or "",
        ), True
    if provider == "deepl" and api_key:
        from backend.providers.translate.deepl_remote import DeepLRemoteProvider

        return DeepLRemoteProvider(api_key=api_key, free=deepl_free), True
    if ollama_url:
        from backend.providers.translate.ollama_local import OllamaLocalProvider

        s = get_settings()
        return OllamaLocalProvider(
            model=model or s.ollama_model, base_url=ollama_url,
        ), True
    return get_translate(), False
