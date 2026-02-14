"""Gateway-specific request/response models (OpenAI-compatible)."""

from pydantic import BaseModel, Field


# --- OpenAI-compatible Audio ---

class TranscriptionResponse(BaseModel):
    text: str


class SpeechRequest(BaseModel):
    input: str
    model: str = "piper"
    voice: str | None = None
    language: str | None = None
    exaggeration: float | None = None
    cfg_weight: float | None = None
    temperature: float | None = None


# --- OpenAI-compatible Models ---

class ModelObject(BaseModel):
    id: str
    object: str = "model"
    owned_by: str = "dolmtschr"


class ModelsListResponse(BaseModel):
    object: str = "list"
    data: list[ModelObject]


# --- Translation ---

class TranslateGatewayRequest(BaseModel):
    text: str
    source: str = "auto"
    target: str = "en"
    model: str | None = None


class TranslateGatewayResponse(BaseModel):
    text: str
    detected_source: str
    model: str


# --- Pipeline ---

class PipelineGatewayResponse(BaseModel):
    transcript: str
    source_lang: str
    translation: str
    audio: str | None = None  # base64 WAV when response_format=json


# --- Service Discovery ---

class HealthProvider(BaseModel):
    status: str
    latency_ms: int | None = None


class HealthResponse(BaseModel):
    status: str
    version: str
    providers: dict[str, HealthProvider]


class VoiceInfo(BaseModel):
    name: str
    provider: str
    language: str | None = None


class VoicesResponse(BaseModel):
    voices: list[VoiceInfo]


class LanguagesGatewayResponse(BaseModel):
    languages: list[str]


# --- Sessions ---

class SessionCreateGateway(BaseModel):
    source_lang: str
    target_lang: str
    audio_enabled: bool = False
    title: str | None = None
    org_id: str | None = None


class SessionUpdateGateway(BaseModel):
    title: str | None = None
    audio_enabled: bool | None = None


# --- Search ---

class SearchGatewayRequest(BaseModel):
    query: str
    org_id: str | None = None
    limit: int = 20
    source_lang: str | None = None
    target_lang: str | None = None
