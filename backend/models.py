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
    chatterbox_url: str | None = None
    exaggeration: float | None = None
    cfg_weight: float | None = None
    temperature: float | None = None
    elevenlabs_key: str | None = None
    elevenlabs_voice_id: str | None = None
    elevenlabs_model: str | None = None
    elevenlabs_stability: float | None = None
    elevenlabs_similarity: float | None = None


class TTSResponse(BaseModel):
    audio: str  # base64-encoded audio
    audio_format: str = "wav"  # wav or mp3
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
    exaggeration: float | None = None
    cfg_weight: float | None = None
    temperature: float | None = None


class PipelineResponse(BaseModel):
    original_text: str
    detected_language: str
    translated_text: str
    audio: str | None = None  # base64 audio if tts=True
    audio_format: str = "wav"  # wav or mp3
    duration_ms: int
    stt_ms: int | None = None
    translate_ms: int | None = None
    tts_ms: int | None = None


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


class LanguagesResponse(BaseModel):
    languages: list[str]


class GpuStatusResponse(BaseModel):
    ollama: dict
    chatterbox: dict


class HealthProviderInfo(BaseModel):
    status: str  # "ok" | "unreachable"
    latency_ms: int | None = None


class HealthResponse(BaseModel):
    providers: dict[str, HealthProviderInfo]


class BenchmarkEntry(BaseModel):
    timestamp: str
    stt_provider: str
    translate_provider: str
    tts_provider: str
    source_lang: str
    target_lang: str
    text_length: int
    stt_ms: int
    translate_ms: int
    tts_ms: int | None = None
    total_ms: int


class BenchmarkResponse(BaseModel):
    entries: list[BenchmarkEntry]
    count: int


class UsageResponse(BaseModel):
    character_count: int
    character_limit: int


# --- Chat History Models ---

class SessionCreate(BaseModel):
    source_lang: str
    target_lang: str
    audio_enabled: bool = False
    title: str | None = None
    org_id: str | None = None


class SessionUpdate(BaseModel):
    title: str | None = None
    audio_enabled: bool | None = None


class SessionResponse(BaseModel):
    id: str
    org_id: str | None = None
    title: str | None = None
    source_lang: str
    target_lang: str
    audio_enabled: bool
    message_count: int = 0
    created_at: str
    updated_at: str
    expires_at: str | None = None


class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]
    total: int


class MessageResponse(BaseModel):
    id: str
    session_id: str
    direction: str
    original_text: str
    translated_text: str
    original_lang: str
    translated_lang: str
    audio_path: str | None = None
    stt_ms: int | None = None
    translate_ms: int | None = None
    tts_ms: int | None = None
    model_used: str | None = None
    created_at: str


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]
    total: int
