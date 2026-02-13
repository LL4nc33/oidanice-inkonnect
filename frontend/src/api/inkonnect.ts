const BASE_URL = '/api'

interface STTResponse {
  text: string
  detected_language: string
  duration_ms: number
}

interface TTSResponse {
  audio: string
  duration_ms: number
}

interface TranslateResponse {
  text: string
  duration_ms: number
}

interface PipelineResponse {
  original_text: string
  detected_language: string
  translated_text: string
  audio: string | null
  audio_format: string
  duration_ms: number
  stt_ms: number | null
  translate_ms: number | null
  tts_ms: number | null
}

interface ConfigResponse {
  stt_provider: string
  tts_provider: string
  translate_provider: string
  device: string
  whisper_model: string
  piper_voice: string
  ollama_model: string
  chatterbox_url: string
  chatterbox_voice: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init)
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${msg}`)
  }
  return res.json()
}

export async function transcribe(audio: Blob, language?: string): Promise<STTResponse> {
  const form = new FormData()
  form.append('file', audio, 'recording.webm')
  const params = language ? `?language=${language}` : ''
  return request(`/stt${params}`, { method: 'POST', body: form })
}

export interface SynthesisParams {
  exaggeration?: number
  cfgWeight?: number
  temperature?: number
}

export async function synthesize(
  text: string,
  lang: string,
  voice?: string,
  ttsProvider?: string,
  params?: SynthesisParams,
  chatterboxUrl?: string,
): Promise<TTSResponse> {
  return request('/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      lang,
      voice,
      tts_provider: ttsProvider,
      chatterbox_url: chatterboxUrl || undefined,
      exaggeration: params?.exaggeration,
      cfg_weight: params?.cfgWeight,
      temperature: params?.temperature,
    }),
  })
}

export async function translate(text: string, source: string, target: string): Promise<TranslateResponse> {
  return request('/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source, target }),
  })
}

export interface ProviderOptions {
  provider?: string
  apiUrl?: string
  apiKey?: string
  deeplFree?: boolean
}

export interface ElevenLabsParams {
  key?: string
  voiceId?: string
  model?: string
  stability?: number
  similarity?: number
}

export async function pipeline(
  audio: Blob,
  sourceLang?: string,
  targetLang: string = 'en',
  tts: boolean = true,
  voice?: string,
  model?: string,
  providerOpts?: ProviderOptions,
  ttsProvider?: string,
  synthesisParams?: SynthesisParams,
  chatterboxUrl?: string,
  ollamaUrl?: string,
  ollamaKeepAlive?: string,
  ollamaContextLength?: number,
  elevenlabsParams?: ElevenLabsParams,
): Promise<PipelineResponse> {
  const form = new FormData()
  form.append('file', audio, 'recording.webm')
  const params = new URLSearchParams()
  if (sourceLang) params.set('source_lang', sourceLang)
  params.set('target_lang', targetLang)
  params.set('tts', String(tts))
  if (voice) params.set('voice', voice)
  if (ttsProvider) params.set('tts_provider', ttsProvider)
  if (model) params.set('model', model)
  if (providerOpts?.provider) params.set('provider', providerOpts.provider)
  if (providerOpts?.apiUrl) params.set('api_url', providerOpts.apiUrl)
  if (providerOpts?.apiKey) params.set('api_key', providerOpts.apiKey)
  if (providerOpts?.deeplFree != null) params.set('deepl_free', String(providerOpts.deeplFree))
  if (synthesisParams?.exaggeration != null) params.set('exaggeration', String(synthesisParams.exaggeration))
  if (synthesisParams?.cfgWeight != null) params.set('cfg_weight', String(synthesisParams.cfgWeight))
  if (synthesisParams?.temperature != null) params.set('temperature', String(synthesisParams.temperature))
  if (chatterboxUrl) params.set('chatterbox_url', chatterboxUrl)
  if (ollamaUrl) params.set('ollama_url', ollamaUrl)
  if (ollamaKeepAlive) params.set('ollama_keep_alive', ollamaKeepAlive)
  if (ollamaContextLength) params.set('ollama_context_length', String(ollamaContextLength))
  if (elevenlabsParams?.key) params.set('elevenlabs_key', elevenlabsParams.key)
  if (elevenlabsParams?.voiceId) params.set('elevenlabs_voice_id', elevenlabsParams.voiceId)
  if (elevenlabsParams?.model) params.set('elevenlabs_model', elevenlabsParams.model)
  if (elevenlabsParams?.stability != null) params.set('elevenlabs_stability', String(elevenlabsParams.stability))
  if (elevenlabsParams?.similarity != null) params.set('elevenlabs_similarity', String(elevenlabsParams.similarity))
  return request(`/pipeline?${params}`, { method: 'POST', body: form })
}

export async function getConfig(): Promise<ConfigResponse> {
  return request('/config')
}

export async function getOllamaModels(url?: string): Promise<string[]> {
  const params = url ? `?url=${encodeURIComponent(url)}` : ''
  const data = await request<{ models: string[] }>(`/ollama/models${params}`)
  return data.models
}

export async function getPiperVoices(): Promise<string[]> {
  const data = await request<{ voices: string[] }>('/piper/voices')
  return data.voices
}

export async function downloadPiperVoice(voice: string): Promise<{ success: boolean; message: string }> {
  return request('/piper/voices/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice }),
  })
}

export async function getOpenAIModels(url: string, key: string): Promise<string[]> {
  const params = new URLSearchParams({ url })
  if (key) params.set('key', key)
  const data = await request<{ models: string[] }>(`/openai/models?${params}`)
  return data.models
}

export interface ChatterboxVoice {
  name: string
  language: string | null
}

export async function getChatterboxVoices(url?: string): Promise<ChatterboxVoice[]> {
  const params = url ? `?url=${encodeURIComponent(url)}` : ''
  const data = await request<{ voices: ChatterboxVoice[] }>(`/chatterbox/voices${params}`)
  return data.voices
}

export async function uploadChatterboxVoice(
  file: File | Blob,
  name: string,
  language?: string,
  url?: string,
): Promise<{ success: boolean; name: string; message: string }> {
  const form = new FormData()
  form.append('file', file instanceof File ? file : new File([file], `${name}.webm`, { type: file.type }))
  form.append('name', name)
  if (language) form.append('language', language)
  const params = url ? `?url=${encodeURIComponent(url)}` : ''
  return request(`/chatterbox/voices${params}`, { method: 'POST', body: form })
}

export async function deleteChatterboxVoice(name: string, url?: string): Promise<{ success: boolean; name: string; message: string }> {
  const params = url ? `?url=${encodeURIComponent(url)}` : ''
  return request(`/chatterbox/voices/${encodeURIComponent(name)}${params}`, { method: 'DELETE' })
}

export async function getChatterboxLanguages(url?: string): Promise<string[]> {
  const params = url ? `?url=${encodeURIComponent(url)}` : ''
  const data = await request<{ languages: string[] }>(`/chatterbox/languages${params}`)
  return data.languages
}

export interface ElevenLabsVoice {
  id: string
  name: string
}

export async function getElevenLabsVoices(key: string): Promise<ElevenLabsVoice[]> {
  if (!key) return []
  const params = new URLSearchParams({ key })
  const data = await request<{ voices: ElevenLabsVoice[] }>(`/elevenlabs/voices?${params}`)
  return data.voices
}

interface OllamaModel {
  name: string
  size: number
  size_vram: number
  expires_at: string
}

interface OllamaPsResponse {
  models?: OllamaModel[]
  error?: string
}

interface ChatterboxMemory {
  gpu_allocated_mb?: number
  gpu_reserved_mb?: number
  error?: string
}

export interface GpuStatus {
  ollama: OllamaPsResponse
  chatterbox: ChatterboxMemory
}

export interface HealthProviderInfo {
  status: string
  latency_ms: number | null
}

export interface HealthResponse {
  providers: Record<string, HealthProviderInfo>
}

export interface BenchmarkEntry {
  timestamp: string
  stt_provider: string
  translate_provider: string
  tts_provider: string
  source_lang: string
  target_lang: string
  text_length: number
  stt_ms: number
  translate_ms: number
  tts_ms: number | null
  total_ms: number
}

export interface UsageResponse {
  character_count: number
  character_limit: number
}

export async function getGpuStatus(ollamaUrl?: string, chatterboxUrl?: string): Promise<GpuStatus> {
  const params = new URLSearchParams()
  if (ollamaUrl) params.set('ollama_url', ollamaUrl)
  if (chatterboxUrl) params.set('chatterbox_url', chatterboxUrl)
  const qs = params.toString()
  return request(`/gpu/status${qs ? `?${qs}` : ''}`)
}

export async function warmupGpu(service: string = 'ollama', ollamaUrl?: string, keepAlive?: string): Promise<void> {
  const params = new URLSearchParams({ service })
  if (ollamaUrl) params.set('ollama_url', ollamaUrl)
  if (keepAlive) params.set('keep_alive', keepAlive)
  await request(`/gpu/warmup?${params}`, { method: 'POST' })
}

export async function getProviderHealth(ollamaUrl?: string, chatterboxUrl?: string): Promise<HealthResponse> {
  const params = new URLSearchParams()
  if (ollamaUrl) params.set('ollama_url', ollamaUrl)
  if (chatterboxUrl) params.set('chatterbox_url', chatterboxUrl)
  const qs = params.toString()
  return request(`/health${qs ? `?${qs}` : ''}`)
}

export async function getRecentBenchmarks(limit: number = 10): Promise<BenchmarkEntry[]> {
  const data = await request<{ entries: BenchmarkEntry[] }>(`/benchmarks/recent?limit=${limit}`)
  return data.entries
}

export async function getDeepLUsage(key: string, free: boolean): Promise<UsageResponse> {
  const params = new URLSearchParams({ key, free: String(free) })
  return request(`/deepl/usage?${params}`)
}

export async function getElevenLabsUsage(key: string): Promise<UsageResponse> {
  const params = new URLSearchParams({ key })
  return request(`/elevenlabs/usage?${params}`)
}
