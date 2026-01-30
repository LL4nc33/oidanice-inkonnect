from fastapi import APIRouter

from backend.dependencies import get_settings
from backend.models import ConfigResponse

router = APIRouter(prefix="/api", tags=["config"])


@router.get("/config", response_model=ConfigResponse)
async def get_config() -> ConfigResponse:
    s = get_settings()
    return ConfigResponse(
        stt_provider=s.stt_provider,
        tts_provider=s.tts_provider,
        translate_provider=s.translate_provider,
        device=s.device,
        whisper_model=s.whisper_model,
        piper_voice=s.piper_voice,
        ollama_model=s.ollama_model,
    )
