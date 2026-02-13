import { useState, useCallback } from 'react'

interface AppSettings {
  sourceLang: string
  targetLang: string
  ttsEnabled: boolean
  ttsProvider: string
  piperVoice: string
  chatterboxVoice: string
  chatterboxUrl: string
  ollamaModel: string
  ollamaUrl: string
  translateProvider: string
  openaiUrl: string
  openaiKey: string
  openaiModel: string
  chatterboxExaggeration: number
  chatterboxCfgWeight: number
  chatterboxTemperature: number
  autoPlay: boolean
  ollamaKeepAlive: string
  ollamaContextLength: string
  deepLKey: string
  deepLFree: boolean
  elevenlabsKey: string
  elevenlabsModel: string
  elevenlabsVoiceId: string
  elevenlabsStability: number
  elevenlabsSimilarity: number
}

const STORAGE_KEY = 'inkonnect-settings'

const DEFAULTS: AppSettings = {
  sourceLang: '',
  targetLang: 'en',
  ttsEnabled: true,
  ttsProvider: 'piper',
  piperVoice: '',
  chatterboxVoice: '',
  chatterboxUrl: '',
  ollamaModel: '',
  ollamaUrl: '',
  translateProvider: 'local',
  openaiUrl: '',
  openaiKey: '',
  openaiModel: '',
  chatterboxExaggeration: 0.5,
  chatterboxCfgWeight: 0.5,
  chatterboxTemperature: 0.8,
  autoPlay: true,
  ollamaKeepAlive: '3m',
  ollamaContextLength: '',
  deepLKey: '',
  deepLFree: true,
  elevenlabsKey: '',
  elevenlabsModel: 'eleven_multilingual_v2',
  elevenlabsVoiceId: '',
  elevenlabsStability: 0.5,
  elevenlabsSimilarity: 0.75,
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
