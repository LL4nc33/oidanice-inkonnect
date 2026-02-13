import logging
import re
from pathlib import Path

import httpx
from fastapi import APIRouter, Form, Query, UploadFile

from backend.dependencies import get_settings
from backend.models import (
    ChatterboxUploadResponse,
    ChatterboxVoice,
    ChatterboxVoicesResponse,
    ConfigResponse,
    ModelsResponse,
    PiperDownloadRequest,
    PiperDownloadResponse,
    PiperVoicesResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["config"])

PIPER_VOICES_DIR = Path("/app/piper-voices")
HF_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main"


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
        chatterbox_url=s.chatterbox_url,
        chatterbox_voice=s.chatterbox_voice,
    )


@router.get("/piper/voices", response_model=PiperVoicesResponse)
async def get_piper_voices() -> PiperVoicesResponse:
    voices: list[str] = []
    if PIPER_VOICES_DIR.exists():
        for f in sorted(PIPER_VOICES_DIR.glob("*.onnx")):
            voices.append(f.stem)
    return PiperVoicesResponse(voices=voices)


def _voice_hf_url(voice_name: str) -> str:
    """Build HuggingFace URL from voice name like 'de_DE-thorsten-high'."""
    parts = voice_name.split("-")
    locale = parts[0]       # de_DE
    lang = locale.split("_")[0]  # de
    name = parts[1]         # thorsten
    quality = parts[2]      # high
    return f"{HF_BASE}/{lang}/{locale}/{name}/{quality}/{voice_name}"


@router.post("/piper/voices/download", response_model=PiperDownloadResponse)
async def download_piper_voice(body: PiperDownloadRequest) -> PiperDownloadResponse:
    voice = body.voice.strip()
    if not voice:
        return PiperDownloadResponse(success=False, message="Voice name is empty")

    parts = voice.split("-")
    if len(parts) < 3:
        return PiperDownloadResponse(
            success=False,
            message=f"Invalid voice name format: {voice} (expected locale-name-quality)",
        )

    onnx_path = PIPER_VOICES_DIR / f"{voice}.onnx"
    if onnx_path.exists():
        return PiperDownloadResponse(success=True, message=f"{voice} already installed")

    base_url = _voice_hf_url(voice)
    PIPER_VOICES_DIR.mkdir(parents=True, exist_ok=True)

    try:
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            for suffix in [".onnx", ".onnx.json"]:
                url = f"{base_url}{suffix}"
                logger.info("Downloading %s", url)
                resp = await client.get(url)
                resp.raise_for_status()
                dest = PIPER_VOICES_DIR / f"{voice}{suffix}"
                dest.write_bytes(resp.content)
                logger.info("Saved %s (%d bytes)", dest, len(resp.content))
    except httpx.HTTPStatusError as exc:
        return PiperDownloadResponse(
            success=False,
            message=f"Download failed: HTTP {exc.response.status_code} for {voice}",
        )
    except Exception as exc:
        return PiperDownloadResponse(success=False, message=f"Download failed: {exc}")

    return PiperDownloadResponse(success=True, message=f"{voice} downloaded successfully")


@router.get("/chatterbox/voices", response_model=ChatterboxVoicesResponse)
async def get_chatterbox_voices() -> ChatterboxVoicesResponse:
    s = get_settings()
    from backend.providers.tts.chatterbox_remote import ChatterboxRemoteProvider

    provider = ChatterboxRemoteProvider(
        base_url=s.chatterbox_url,
        voice=s.chatterbox_voice,
    )
    try:
        raw_voices = await provider.get_voices()
        voices = [ChatterboxVoice(**v) for v in raw_voices]
        return ChatterboxVoicesResponse(voices=voices)
    except Exception:
        logger.warning("Could not fetch Chatterbox voices from %s", s.chatterbox_url)
        return ChatterboxVoicesResponse(voices=[])
    finally:
        await provider.cleanup()


@router.post("/chatterbox/voices", response_model=ChatterboxUploadResponse)
async def upload_chatterbox_voice(
    file: UploadFile,
    name: str = Form(...),
) -> ChatterboxUploadResponse:
    s = get_settings()
    from backend.providers.tts.chatterbox_remote import ChatterboxRemoteProvider

    if not re.match(r'^[\w\-]+$', name):
        return ChatterboxUploadResponse(success=False, name=name, message="Invalid voice name")

    max_size = 10 * 1024 * 1024  # 10 MB
    audio_data = await file.read()
    if len(audio_data) > max_size:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"File too large ({len(audio_data)} bytes, max {max_size})",
        )

    provider = ChatterboxRemoteProvider(
        base_url=s.chatterbox_url,
        voice=s.chatterbox_voice,
    )
    try:
        result = await provider.upload_voice(name, audio_data)
        return ChatterboxUploadResponse(
            success=bool(result.get("success", True)),
            name=name,
            message=str(result.get("message", "Voice uploaded successfully")),
        )
    except httpx.HTTPStatusError as exc:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"Upload failed: HTTP {exc.response.status_code}",
        )
    except Exception as exc:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"Upload failed: {exc}",
        )
    finally:
        await provider.cleanup()


@router.delete("/chatterbox/voices/{name}", response_model=ChatterboxUploadResponse)
async def delete_chatterbox_voice(name: str) -> ChatterboxUploadResponse:
    if not re.match(r'^[\w\-]+$', name):
        return ChatterboxUploadResponse(success=False, name=name, message="Invalid voice name")
    s = get_settings()
    from backend.providers.tts.chatterbox_remote import ChatterboxRemoteProvider

    provider = ChatterboxRemoteProvider(
        base_url=s.chatterbox_url,
        voice=s.chatterbox_voice,
    )
    try:
        result = await provider.delete_voice(name)
        return ChatterboxUploadResponse(
            success=bool(result.get("success", True)),
            name=name,
            message=str(result.get("message", "Voice deleted successfully")),
        )
    except httpx.HTTPStatusError as exc:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"Delete failed: HTTP {exc.response.status_code}",
        )
    except Exception as exc:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"Delete failed: {exc}",
        )
    finally:
        await provider.cleanup()


@router.get("/ollama/models", response_model=ModelsResponse)
async def get_ollama_models(
    url: str | None = Query(None),
) -> ModelsResponse:
    s = get_settings()
    ollama_url = (url or s.ollama_url).rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{ollama_url}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            names = [m["name"] for m in data.get("models", [])]
            return ModelsResponse(models=names)
    except Exception:
        logger.warning("Could not fetch Ollama models from %s", ollama_url)
        return ModelsResponse(models=[])


@router.get("/openai/models", response_model=ModelsResponse)
async def get_openai_models(
    url: str = Query(...),
    key: str = Query(""),
) -> ModelsResponse:
    headers: dict[str, str] = {}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            base = url.rstrip("/").removesuffix("/v1")
            resp = await client.get(f"{base}/v1/models")
            resp.raise_for_status()
            data = resp.json()
            names = [m["id"] for m in data.get("data", [])]
            return ModelsResponse(models=sorted(names))
    except Exception:
        logger.warning("Could not fetch OpenAI-compat models from %s", url)
        return ModelsResponse(models=[])
