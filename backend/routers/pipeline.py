import base64
import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from backend.dependencies import get_settings, get_stt
from backend.models import PipelineResponse
from backend.resolver import resolve_translate, resolve_tts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["pipeline"])

BENCHMARKS_DIR = Path(__file__).resolve().parent.parent.parent / "benchmarks"


def _log_benchmark(entry: dict) -> None:
    try:
        BENCHMARKS_DIR.mkdir(parents=True, exist_ok=True)
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        path = BENCHMARKS_DIR / f"{today}.jsonl"
        with path.open("a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        logger.debug("Benchmark logging failed", exc_info=True)


@router.post("/pipeline", response_model=PipelineResponse)
async def full_pipeline(
    file: UploadFile = File(...),
    source_lang: str | None = Query(None),
    target_lang: str = Query("en"),
    tts: bool = Query(True),
    voice: str | None = Query(None),
    tts_provider: str | None = Query(None),
    exaggeration: float | None = Query(None),
    cfg_weight: float | None = Query(None),
    temperature: float | None = Query(None),
    model: str | None = Query(None),
    provider: str | None = Query(None),
    api_url: str | None = Query(None),
    api_key: str | None = Query(None),
    chatterbox_url: str | None = Query(None),
    ollama_url: str | None = Query(None),
    ollama_keep_alive: str | None = Query(None),
    ollama_context_length: int | None = Query(None),
    deepl_free: bool = Query(True),
    elevenlabs_key: str | None = Query(None),
    elevenlabs_voice_id: str | None = Query(None),
    elevenlabs_model: str | None = Query(None),
    elevenlabs_stability: float | None = Query(None),
    elevenlabs_similarity: float | None = Query(None),
) -> PipelineResponse:
    total_start = time.perf_counter()

    # 1. STT
    t0 = time.perf_counter()
    audio = await file.read()
    text, detected_lang = await get_stt().transcribe(audio, source_lang)
    stt_ms = int((time.perf_counter() - t0) * 1000)

    if not text.strip():
        raise HTTPException(status_code=400, detail="No speech detected")

    # 2. Translate
    t0 = time.perf_counter()
    translator, ad_hoc = resolve_translate(provider, api_url, api_key, model, ollama_url, deepl_free)
    try:
        translated = await translator.translate(
            text, detected_lang, target_lang, model,
            keep_alive=ollama_keep_alive, num_ctx=ollama_context_length,
        )
    finally:
        if ad_hoc:
            await translator.cleanup()
    translate_ms = int((time.perf_counter() - t0) * 1000)

    # 3. TTS (optional)
    audio_b64: str | None = None
    tts_ms: int | None = None
    if tts:
        t0 = time.perf_counter()
        tts_impl, tts_ad_hoc = resolve_tts(
            tts_provider, voice, chatterbox_url,
            elevenlabs_key, elevenlabs_voice_id, elevenlabs_model,
            elevenlabs_stability, elevenlabs_similarity,
        )
        try:
            audio_bytes = await tts_impl.synthesize(
                translated,
                target_lang,
                voice if tts_provider != "elevenlabs" else elevenlabs_voice_id,
                exaggeration=exaggeration,
                cfg_weight=cfg_weight,
                temperature=temperature,
                stability=elevenlabs_stability,
                similarity_boost=elevenlabs_similarity,
            )
            audio_b64 = base64.b64encode(audio_bytes).decode()
        finally:
            if tts_ad_hoc:
                await tts_impl.cleanup()
        tts_ms = int((time.perf_counter() - t0) * 1000)

    audio_fmt = "mp3" if tts_provider == "elevenlabs" else "wav"
    duration_ms = int((time.perf_counter() - total_start) * 1000)

    # Benchmark logging
    s = get_settings()
    translate_provider_name = provider or s.translate_provider
    if translate_provider_name == "local":
        translate_provider_name = f"ollama/{model or s.ollama_model}"
    tts_provider_name = tts_provider or s.tts_provider
    _log_benchmark({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "stt_provider": f"whisper-{s.whisper_model}",
        "translate_provider": translate_provider_name,
        "tts_provider": tts_provider_name,
        "source_lang": detected_lang,
        "target_lang": target_lang,
        "text_length": len(text),
        "stt_ms": stt_ms,
        "translate_ms": translate_ms,
        "tts_ms": tts_ms,
        "total_ms": duration_ms,
    })

    return PipelineResponse(
        original_text=text,
        detected_language=detected_lang,
        translated_text=translated,
        audio=audio_b64,
        audio_format=audio_fmt,
        duration_ms=duration_ms,
        stt_ms=stt_ms,
        translate_ms=translate_ms,
        tts_ms=tts_ms,
    )
