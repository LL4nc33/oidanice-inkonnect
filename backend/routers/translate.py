import time

from fastapi import APIRouter, Query

from backend.dependencies import get_translate
from backend.models import TranslateRequest, TranslateResponse

router = APIRouter(prefix="/api", tags=["translate"])


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(
    req: TranslateRequest,
    provider: str | None = Query(None),
    api_url: str | None = Query(None),
    api_key: str | None = Query(None),
) -> TranslateResponse:
    start = time.perf_counter()

    ad_hoc = False
    if provider == "openai" and api_url:
        from backend.providers.translate.openai_compat import OpenAICompatProvider
        translator = OpenAICompatProvider(model="", base_url=api_url, api_key=api_key or "")
        ad_hoc = True
    else:
        translator = get_translate()

    try:
        translated = await translator.translate(req.text, req.source, req.target)
    finally:
        if ad_hoc:
            await translator.cleanup()

    duration_ms = int((time.perf_counter() - start) * 1000)
    return TranslateResponse(text=translated, duration_ms=duration_ms)
