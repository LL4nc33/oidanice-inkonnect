import { useEffect, useState } from 'react'
import { Card, Divider } from '@oidanice/ink-ui'
import { getConfig } from '../api/inkonnect'
import { useProviderHealth } from '../hooks/useProviderHealth'
import { SettingsNav } from '../components/settings/SettingsNav'
import { ProviderStatusGrid } from '../components/settings/ProviderStatusGrid'
import { GpuMonitor } from '../components/settings/GpuMonitor'
import { CloudUsage } from '../components/settings/CloudUsage'
import { BenchmarkWidget } from '../components/settings/BenchmarkWidget'
import { TTSConfig } from '../components/settings/TTSConfig'
import { TranslateConfig } from '../components/settings/TranslateConfig'

interface SettingsProps {
  ttsEnabled: boolean
  onTtsChange: (enabled: boolean) => void
  ttsProvider: string
  onTtsProviderChange: (provider: string) => void
  piperVoice: string
  onPiperVoiceChange: (voice: string) => void
  chatterboxVoice: string
  onChatterboxVoiceChange: (voice: string) => void
  chatterboxUrl: string
  onChatterboxUrlChange: (url: string) => void
  ollamaModel: string
  onOllamaModelChange: (model: string) => void
  ollamaUrl: string
  onOllamaUrlChange: (url: string) => void
  translateProvider: string
  onTranslateProviderChange: (provider: string) => void
  openaiUrl: string
  onOpenaiUrlChange: (url: string) => void
  openaiKey: string
  onOpenaiKeyChange: (key: string) => void
  openaiModel: string
  onOpenaiModelChange: (model: string) => void
  chatterboxExaggeration: number
  onChatterboxExaggerationChange: (value: number) => void
  chatterboxCfgWeight: number
  onChatterboxCfgWeightChange: (value: number) => void
  chatterboxTemperature: number
  onChatterboxTemperatureChange: (value: number) => void
  autoPlay: boolean
  onAutoPlayChange: (enabled: boolean) => void
  ollamaKeepAlive: string
  onOllamaKeepAliveChange: (value: string) => void
  ollamaContextLength: string
  onOllamaContextLengthChange: (value: string) => void
  deepLKey: string
  onDeepLKeyChange: (key: string) => void
  deepLFree: boolean
  onDeepLFreeChange: (free: boolean) => void
  elevenlabsKey: string
  onElevenlabsKeyChange: (key: string) => void
  elevenlabsModel: string
  onElevenlabsModelChange: (model: string) => void
  elevenlabsVoiceId: string
  onElevenlabsVoiceIdChange: (id: string) => void
  elevenlabsStability: number
  onElevenlabsStabilityChange: (v: number) => void
  elevenlabsSimilarity: number
  onElevenlabsSimilarityChange: (v: number) => void
}

interface BackendConfig {
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

export function Settings(props: SettingsProps) {
  const [config, setConfig] = useState<BackendConfig | null>(null)
  const [activeSection, setActiveSection] = useState('section-status')
  const health = useProviderHealth(props.ollamaUrl || undefined, props.chatterboxUrl || undefined)

  useEffect(() => {
    getConfig().then(setConfig).catch(() => {})
    health.refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveSection(entry.target.id); break }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' },
    )
    for (const id of ['section-status', 'section-tts', 'section-translation', 'section-backend']) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl">Settings</h2>

      <SettingsNav activeSection={activeSection} />

      {/* --- MONITOR ZONE --- */}
      <div id="section-status" className="space-y-4">
        <ProviderStatusGrid
          providers={health.providers}
          deepLKey={props.deepLKey}
          elevenlabsKey={props.elevenlabsKey}
        />
        <GpuMonitor
          gpuStatus={health.gpuStatus}
          loading={health.loading}
          lastUpdated={health.lastUpdated}
          onRefresh={health.refresh}
        />
        <CloudUsage
          deepLKey={props.deepLKey}
          deepLFree={props.deepLFree}
          elevenlabsKey={props.elevenlabsKey}
        />
        <BenchmarkWidget />
      </div>

      {/* --- CONFIGURE ZONE --- */}
      <div id="section-tts">
        <TTSConfig
          ttsEnabled={props.ttsEnabled}
          onTtsChange={props.onTtsChange}
          autoPlay={props.autoPlay}
          onAutoPlayChange={props.onAutoPlayChange}
          ttsProvider={props.ttsProvider}
          onTtsProviderChange={props.onTtsProviderChange}
          piperVoice={props.piperVoice}
          onPiperVoiceChange={props.onPiperVoiceChange}
          chatterboxVoice={props.chatterboxVoice}
          onChatterboxVoiceChange={props.onChatterboxVoiceChange}
          chatterboxUrl={props.chatterboxUrl}
          onChatterboxUrlChange={props.onChatterboxUrlChange}
          chatterboxExaggeration={props.chatterboxExaggeration}
          onChatterboxExaggerationChange={props.onChatterboxExaggerationChange}
          chatterboxCfgWeight={props.chatterboxCfgWeight}
          onChatterboxCfgWeightChange={props.onChatterboxCfgWeightChange}
          chatterboxTemperature={props.chatterboxTemperature}
          onChatterboxTemperatureChange={props.onChatterboxTemperatureChange}
          elevenlabsKey={props.elevenlabsKey}
          onElevenlabsKeyChange={props.onElevenlabsKeyChange}
          elevenlabsModel={props.elevenlabsModel}
          onElevenlabsModelChange={props.onElevenlabsModelChange}
          elevenlabsVoiceId={props.elevenlabsVoiceId}
          onElevenlabsVoiceIdChange={props.onElevenlabsVoiceIdChange}
          elevenlabsStability={props.elevenlabsStability}
          onElevenlabsStabilityChange={props.onElevenlabsStabilityChange}
          elevenlabsSimilarity={props.elevenlabsSimilarity}
          onElevenlabsSimilarityChange={props.onElevenlabsSimilarityChange}
        />
      </div>

      <div id="section-translation">
        <TranslateConfig
          translateProvider={props.translateProvider}
          onTranslateProviderChange={props.onTranslateProviderChange}
          ollamaUrl={props.ollamaUrl}
          onOllamaUrlChange={props.onOllamaUrlChange}
          ollamaModel={props.ollamaModel}
          onOllamaModelChange={props.onOllamaModelChange}
          ollamaKeepAlive={props.ollamaKeepAlive}
          onOllamaKeepAliveChange={props.onOllamaKeepAliveChange}
          ollamaContextLength={props.ollamaContextLength}
          onOllamaContextLengthChange={props.onOllamaContextLengthChange}
          openaiUrl={props.openaiUrl}
          onOpenaiUrlChange={props.onOpenaiUrlChange}
          openaiKey={props.openaiKey}
          onOpenaiKeyChange={props.onOpenaiKeyChange}
          openaiModel={props.openaiModel}
          onOpenaiModelChange={props.onOpenaiModelChange}
          deepLKey={props.deepLKey}
          onDeepLKeyChange={props.onDeepLKeyChange}
          deepLFree={props.deepLFree}
          onDeepLFreeChange={props.onDeepLFreeChange}
        />
      </div>

      {config && (
        <div id="section-backend">
          <Card>
            <h3 className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>backend info</h3>
            <dl className="font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <dt>device</dt>
                <dd>{config.device}</dd>
              </div>
              <Divider spacing="sm" />
              <div className="flex justify-between">
                <dt>stt</dt>
                <dd>{config.stt_provider} ({config.whisper_model})</dd>
              </div>
              {props.ttsEnabled && (
                <>
                  <Divider spacing="sm" />
                  <div className="flex justify-between">
                    <dt>tts</dt>
                    <dd>
                      {props.ttsProvider === 'chatterbox'
                        ? `chatterbox (${props.chatterboxVoice || config.chatterbox_voice})`
                        : props.ttsProvider === 'elevenlabs'
                          ? `elevenlabs (${props.elevenlabsModel})`
                          : `piper (${props.piperVoice || config.piper_voice})`}
                    </dd>
                  </div>
                </>
              )}
              <Divider spacing="sm" />
              <div className="flex justify-between">
                <dt>translate</dt>
                <dd>
                  {props.translateProvider === 'openai'
                    ? `openai (${props.openaiModel || 'default'})`
                    : props.translateProvider === 'deepl'
                      ? 'deepl'
                      : `ollama (${props.ollamaModel || config.ollama_model})`}
                </dd>
              </div>
              <Divider spacing="sm" />
              <div className="flex justify-between">
                <dt>api docs</dt>
                <dd>
                  <a
                    href="/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}
                  >
                    Swagger UI →
                  </a>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      )}
    </div>
  )
}
