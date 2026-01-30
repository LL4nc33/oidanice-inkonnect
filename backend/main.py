import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import Settings
from backend.dependencies import init_providers, get_stt, get_tts, get_translate
from backend.providers import create_stt, create_tts, create_translate
from backend.routers import stt, tts, translate, pipeline, config

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = Settings()
    logger.info("Initializing providers (device=%s)", settings.device)

    stt_provider = create_stt(settings)
    tts_provider = create_tts(settings)
    translate_provider = create_translate(settings)

    init_providers(settings, stt_provider, tts_provider, translate_provider)
    logger.info("Providers ready")

    yield

    logger.info("Shutting down providers")
    await get_stt().cleanup()
    await get_tts().cleanup()
    await get_translate().cleanup()


_version_file = Path(__file__).resolve().parent.parent / "VERSION"
_version = _version_file.read_text().strip() if _version_file.exists() else "0.0.0"

app = FastAPI(title="inkonnect", version=_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stt.router)
app.include_router(tts.router)
app.include_router(translate.router)
app.include_router(pipeline.router)
app.include_router(config.router)
