import base64
import time

from fastapi import APIRouter

from backend.dependencies import get_settings, get_tts
from backend.models import TTSRequest, TTSResponse
from backend.providers.base import TTSProvider

router = APIRouter(prefix="/api", tags=["tts"])


def _resolve_tts(
    tts_provider: str | None,
    voice: str | None,
    chatterbox_url: str | None = None,
) -> tuple[TTSProvider, bool]:
    """Return (provider_instance, is_ad_hoc). Ad-hoc providers must be cleaned up."""
    if tts_provider == "chatterbox":
        from backend.providers.tts.chatterbox_remote import ChatterboxRemoteProvider

        s = get_settings()
        return ChatterboxRemoteProvider(
            base_url=chatterbox_url or s.chatterbox_url,
            voice=voice or s.chatterbox_voice,
        ), True
    return get_tts(), False


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest) -> TTSResponse:
    start = time.perf_counter()
    tts_impl, ad_hoc = _resolve_tts(req.tts_provider, req.voice, req.chatterbox_url)
    try:
        audio_bytes = await tts_impl.synthesize(
            req.text,
            req.lang,
            req.voice,
            exaggeration=req.exaggeration,
            cfg_weight=req.cfg_weight,
            temperature=req.temperature,
        )
        duration_ms = int((time.perf_counter() - start) * 1000)
        audio_b64 = base64.b64encode(audio_bytes).decode()
        return TTSResponse(audio=audio_b64, duration_ms=duration_ms)
    finally:
        if ad_hoc:
            await tts_impl.cleanup()
