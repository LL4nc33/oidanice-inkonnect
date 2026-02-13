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
  duration_ms: number
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

export async function synthesize(text: string, lang: string, voice?: string, ttsProvider?: string): Promise<TTSResponse> {
  return request('/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang, voice, tts_provider: ttsProvider }),
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

export async function getChatterboxVoices(): Promise<ChatterboxVoice[]> {
  const data = await request<{ voices: ChatterboxVoice[] }>('/chatterbox/voices')
  return data.voices
}

export async function uploadChatterboxVoice(file: File, name: string): Promise<{ success: boolean; name: string; message: string }> {
  const form = new FormData()
  form.append('file', file)
  form.append('name', name)
  return request('/chatterbox/voices', { method: 'POST', body: form })
}

export async function deleteChatterboxVoice(name: string): Promise<{ success: boolean; name: string; message: string }> {
  return request(`/chatterbox/voices/${encodeURIComponent(name)}`, { method: 'DELETE' })
}
