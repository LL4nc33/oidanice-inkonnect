import time

from fastapi import APIRouter, Query

from backend.models import TranslateRequest, TranslateResponse
from backend.resolver import resolve_translate

router = APIRouter(prefix="/api", tags=["translate"])


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(
    req: TranslateRequest,
    provider: str | None = Query(None),
    api_url: str | None = Query(None),
    api_key: str | None = Query(None),
    model: str | None = Query(None),
    ollama_url: str | None = Query(None),
    thinking: bool = Query(True),
) -> TranslateResponse:
    start = time.perf_counter()
    translator, ad_hoc = resolve_translate(provider, api_url, api_key, model, ollama_url)
    try:
        translated = await translator.translate(req.text, req.source, req.target, model, thinking=thinking)
    finally:
        if ad_hoc:
            await translator.cleanup()
    duration_ms = int((time.perf_counter() - start) * 1000)
    return TranslateResponse(text=translated, duration_ms=duration_ms)
