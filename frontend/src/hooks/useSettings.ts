import { useState, useCallback } from 'react'

interface AppSettings {
  sourceLang: string
  targetLang: string
  ttsEnabled: boolean
  ttsProvider: string
  piperVoice: string
  chatterboxVoice: string
  ollamaModel: string
  ollamaUrl: string
  translateProvider: string
  openaiUrl: string
  openaiKey: string
  openaiModel: string
}

const STORAGE_KEY = 'inkonnect-settings'

const DEFAULTS: AppSettings = {
  sourceLang: '',
  targetLang: 'en',
  ttsEnabled: true,
  ttsProvider: 'piper',
  piperVoice: '',
  chatterboxVoice: '',
  ollamaModel: '',
  ollamaUrl: '',
  translateProvider: 'local',
  openaiUrl: '',
  openaiKey: '',
  openaiModel: '',
}

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULTS
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(load)

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { settings, update }
}
