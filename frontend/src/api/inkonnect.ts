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

export async function synthesize(text: string, lang: string, voice?: string): Promise<TTSResponse> {
  return request('/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang, voice }),
  })
}

export async function translate(text: string, source: string, target: string): Promise<TranslateResponse> {
  return request('/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source, target }),
  })
}

export async function pipeline(
  audio: Blob,
  sourceLang?: string,
  targetLang: string = 'en',
  tts: boolean = true,
  voice?: string,
): Promise<PipelineResponse> {
  const form = new FormData()
  form.append('file', audio, 'recording.webm')
  const params = new URLSearchParams()
  if (sourceLang) params.set('source_lang', sourceLang)
  params.set('target_lang', targetLang)
  params.set('tts', String(tts))
  if (voice) params.set('voice', voice)
  return request(`/pipeline?${params}`, { method: 'POST', body: form })
}

export async function getConfig(): Promise<ConfigResponse> {
  return request('/config')
}
