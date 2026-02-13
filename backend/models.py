from pydantic import BaseModel


class STTRequest(BaseModel):
    language: str | None = None


class STTResponse(BaseModel):
    text: str
    detected_language: str
    duration_ms: int


class TTSRequest(BaseModel):
    text: str
    lang: str = "de"
    voice: str | None = None
    tts_provider: str | None = None


class TTSResponse(BaseModel):
    audio: str  # base64-encoded WAV
    duration_ms: int


class TranslateRequest(BaseModel):
    text: str
    source: str
    target: str


class TranslateResponse(BaseModel):
    text: str
    duration_ms: int


class PipelineRequest(BaseModel):
    source_lang: str | None = None
    target_lang: str = "en"
    tts: bool = True
    voice: str | None = None
    tts_provider: str | None = None


class PipelineResponse(BaseModel):
    original_text: str
    detected_language: str
    translated_text: str
    audio: str | None = None  # base64 WAV if tts=True
    duration_ms: int


class ConfigResponse(BaseModel):
    stt_provider: str
    tts_provider: str
    translate_provider: str
    device: str
    whisper_model: str
    piper_voice: str
    ollama_model: str
    chatterbox_url: str
    chatterbox_voice: str


class ModelsResponse(BaseModel):
    models: list[str]


class PiperVoicesResponse(BaseModel):
    voices: list[str]


class PiperDownloadRequest(BaseModel):
    voice: str


class PiperDownloadResponse(BaseModel):
    success: bool
    message: str


class ChatterboxVoice(BaseModel):
    name: str
    language: str | None = None


class ChatterboxVoicesResponse(BaseModel):
    voices: list[ChatterboxVoice]


class ChatterboxUploadResponse(BaseModel):
    success: bool
    name: str
    message: str
