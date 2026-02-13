import { useState, useEffect, useCallback } from 'react'
import { Card, Select, Input, Divider, Button } from '@oidanice/ink-ui'
import { getConfig, getOllamaModels, getOpenAIModels, getPiperVoices, downloadPiperVoice, getGpuStatus, getChatterboxVoices, GpuStatus, ChatterboxVoice } from '../api/inkonnect'
import { SearchSelect } from '../components/SearchSelect'
import { ChatterboxVoiceManager } from '../components/ChatterboxVoiceManager'

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
}

function RangeSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex items-center gap-2 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
      <span className="w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="flex-1"
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="w-10 text-right">{value.toFixed(2)}</span>
    </label>
  )
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

export function Settings({
  ttsEnabled, onTtsChange,
  ttsProvider, onTtsProviderChange,
  piperVoice, onPiperVoiceChange,
  chatterboxVoice, onChatterboxVoiceChange,
  chatterboxUrl, onChatterboxUrlChange,
  ollamaModel, onOllamaModelChange,
  ollamaUrl, onOllamaUrlChange,
  translateProvider, onTranslateProviderChange,
  openaiUrl, onOpenaiUrlChange,
  openaiKey, onOpenaiKeyChange,
  openaiModel, onOpenaiModelChange,
  chatterboxExaggeration, onChatterboxExaggerationChange,
  chatterboxCfgWeight, onChatterboxCfgWeightChange,
  chatterboxTemperature, onChatterboxTemperatureChange,
  autoPlay, onAutoPlayChange,
}: SettingsProps) {
  const [config, setConfig] = useState<BackendConfig | null>(null)
  const [gpuStatus, setGpuStatus] = useState<GpuStatus | null>(null)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [openaiModels, setOpenaiModels] = useState<string[]>([])
  const [loadingOllamaModels, setLoadingOllamaModels] = useState(false)
  const [loadingOpenaiModels, setLoadingOpenaiModels] = useState(false)

  const [piperVoices, setPiperVoices] = useState<string[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [newVoiceName, setNewVoiceName] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)

  const [chatterboxVoices, setChatterboxVoices] = useState<ChatterboxVoice[]>([])
  const [loadingChatterboxVoices, setLoadingChatterboxVoices] = useState(false)

  useEffect(() => {
    getConfig().then(setConfig).catch(() => {})
    getGpuStatus().then(setGpuStatus).catch(() => {})
  }, [])

  const loadVoices = () => {
    setLoadingVoices(true)
    getPiperVoices()
      .then(setPiperVoices)
      .catch(() => setPiperVoices([]))
      .finally(() => setLoadingVoices(false))
  }

  const loadChatterboxVoices = useCallback(() => {
    setLoadingChatterboxVoices(true)
    getChatterboxVoices(chatterboxUrl || undefined)
      .then(setChatterboxVoices)
      .catch(() => setChatterboxVoices([]))
      .finally(() => setLoadingChatterboxVoices(false))
  }, [chatterboxUrl])

  useEffect(() => {
    loadVoices()
  }, [])

  useEffect(() => {
    loadChatterboxVoices()
  }, [loadChatterboxVoices])

  useEffect(() => {
    setLoadingOllamaModels(true)
    getOllamaModels(ollamaUrl || undefined)
      .then(setOllamaModels)
      .catch(() => setOllamaModels([]))
      .finally(() => setLoadingOllamaModels(false))
  }, [ollamaUrl])

  useEffect(() => {
    if (translateProvider !== 'openai' || !openaiUrl) {
      setOpenaiModels([])
      return
    }
    setLoadingOpenaiModels(true)
    getOpenAIModels(openaiUrl, openaiKey)
      .then(setOpenaiModels)
      .catch(() => setOpenaiModels([]))
      .finally(() => setLoadingOpenaiModels(false))
  }, [translateProvider, openaiUrl, openaiKey])

  const handleDownload = async () => {
    const name = newVoiceName.trim()
    if (!name) return
    setDownloading(true)
    setDownloadStatus(null)
    try {
      const res = await downloadPiperVoice(name)
      setDownloadStatus(res.message)
      if (res.success) {
        setNewVoiceName('')
        loadVoices()
      }
    } catch (err) {
      setDownloadStatus(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl">Settings</h2>

      <Card>
        <h3 className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>text-to-speech</h3>
        <div className="space-y-3">
          <Select
            label="TTS Output"
            value={ttsEnabled ? 'on' : 'off'}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onTtsChange(e.target.value === 'on')}
          >
            <option value="on">Enabled</option>
            <option value="off">Disabled</option>
          </Select>

          <Select
            label="Auto-Play"
            value={autoPlay ? 'on' : 'off'}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onAutoPlayChange(e.target.value === 'on')}
          >
            <option value="on">Enabled</option>
            <option value="off">Disabled</option>
          </Select>

          {ttsEnabled && (
            <>
              <Select
                label="TTS Provider"
                value={ttsProvider}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onTtsProviderChange(e.target.value)}
              >
                <option value="piper">Piper (Local)</option>
                <option value="chatterbox">Chatterbox (Remote)</option>
              </Select>

              <Divider spacing="sm" />

              {ttsProvider === 'piper' && (
                <>
                  <SearchSelect
                    label={loadingVoices ? 'Voice (loading...)' : 'Voice'}
                    value={piperVoice}
                    options={piperVoices}
                    placeholder="Backend default"
                    onChange={onPiperVoiceChange}
                  />

                  <Divider spacing="sm" />

                  <div className="space-y-2">
                    <Input
                      label="Download Voice"
                      placeholder="e.g. en_US-lessac-high"
                      value={newVoiceName}
                      onChange={(e) => setNewVoiceName(e.target.value)}
                    />
                    <Button
                      onClick={handleDownload}
                      disabled={downloading || !newVoiceName.trim()}
                    >
                      {downloading ? 'Downloading...' : 'Download'}
                    </Button>
                    {downloadStatus && (
                      <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {downloadStatus}
                      </p>
                    )}
                  </div>
                </>
              )}

              {ttsProvider === 'chatterbox' && (
                <>
                  <Input
                    label="Chatterbox URL"
                    placeholder="http://gpu00.node:4123"
                    value={chatterboxUrl}
                    onChange={(e) => onChatterboxUrlChange(e.target.value)}
                  />

                  <SearchSelect
                    label={loadingChatterboxVoices ? 'Voice (loading...)' : 'Voice'}
                    value={chatterboxVoice}
                    options={chatterboxVoices.map((v) => v.name)}
                    placeholder="Select voice..."
                    onChange={onChatterboxVoiceChange}
                  />

                  <div className="space-y-2 mt-2">
                    <RangeSlider label="exaggeration" value={chatterboxExaggeration} min={0.25} max={2.0} step={0.05} onChange={onChatterboxExaggerationChange} />
                    <RangeSlider label="cfg_weight" value={chatterboxCfgWeight} min={0.0} max={1.0} step={0.05} onChange={onChatterboxCfgWeightChange} />
                    <RangeSlider label="temperature" value={chatterboxTemperature} min={0.05} max={5.0} step={0.05} onChange={onChatterboxTemperatureChange} />
                  </div>

                  <Divider spacing="sm" />

                  <ChatterboxVoiceManager
                    selectedVoice={chatterboxVoice}
                    onVoiceChange={onChatterboxVoiceChange}
                    onVoicesChanged={loadChatterboxVoices}
                    chatterboxUrl={chatterboxUrl}
                  />
                </>
              )}
            </>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>translation provider</h3>
        <div className="space-y-3">
          <Select
            label="Provider"
            value={translateProvider}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onTranslateProviderChange(e.target.value)}
          >
            <option value="local">Ollama (Local)</option>
            <option value="openai">OpenAI Compatible</option>
          </Select>

          {translateProvider === 'local' && (
            <>
              <Input
                label="Ollama URL"
                placeholder="http://localhost:11434"
                value={ollamaUrl}
                onChange={(e) => onOllamaUrlChange(e.target.value)}
              />
              <SearchSelect
                label={loadingOllamaModels ? 'Model (loading...)' : 'Translation Model'}
                value={ollamaModel}
                options={ollamaModels}
                placeholder="Search models..."
                onChange={onOllamaModelChange}
              />
            </>
          )}

          {translateProvider === 'openai' && (
            <>
              <Input
                label="API URL"
                placeholder="https://openrouter.ai/api/v1"
                value={openaiUrl}
                onChange={(e) => onOpenaiUrlChange(e.target.value)}
              />
              <Input
                label="API Key"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => onOpenaiKeyChange(e.target.value)}
              />
              <SearchSelect
                label={loadingOpenaiModels ? 'Model (loading...)' : 'Model'}
                value={openaiModel}
                options={openaiModels}
                placeholder="Search or type model name..."
                onChange={onOpenaiModelChange}
              />
            </>
          )}
        </div>
      </Card>

      {config && (
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
            <Divider spacing="sm" />
            <div className="flex justify-between">
              <dt>tts</dt>
              <dd>{config.tts_provider} ({config.piper_voice})</dd>
            </div>
            {config.chatterbox_url && (
              <>
                <Divider spacing="sm" />
                <div className="flex justify-between">
                  <dt>chatterbox</dt>
                  <dd>{config.chatterbox_voice} @ {config.chatterbox_url}</dd>
                </div>
              </>
            )}
            <Divider spacing="sm" />
            <div className="flex justify-between">
              <dt>translate</dt>
              <dd>{config.translate_provider} ({config.ollama_model})</dd>
            </div>
            {gpuStatus && (
              <>
                <Divider spacing="sm" />
                <div className="flex justify-between">
                  <dt>gpu</dt>
                  <dd className="text-right">
                    {gpuStatus.ollama.error ? 'ollama: offline' : 'ollama: online'}
                    {' / '}
                    {gpuStatus.chatterbox.error ? 'chatterbox: offline' : 'chatterbox: online'}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </Card>
      )}
    </div>
  )
}
