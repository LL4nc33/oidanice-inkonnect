import { useState, useEffect } from 'react'
import { Card, Select, Divider } from '@oidanice/kindle-ui'
import { getConfig } from '../api/inkonnect'

interface SettingsProps {
  ttsEnabled: boolean
  onTtsChange: (enabled: boolean) => void
}

interface BackendConfig {
  stt_provider: string
  tts_provider: string
  translate_provider: string
  device: string
  whisper_model: string
  piper_voice: string
  ollama_model: string
}

export function Settings({ ttsEnabled, onTtsChange }: SettingsProps) {
  const [config, setConfig] = useState<BackendConfig | null>(null)

  useEffect(() => {
    getConfig().then(setConfig).catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl">Settings</h2>

      <Card>
        <h3 className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>output</h3>
        <Select
          label="Text-to-Speech"
          value={ttsEnabled ? 'on' : 'off'}
          onChange={(e) => onTtsChange(e.target.value === 'on')}
        >
          <option value="on">Enabled</option>
          <option value="off">Disabled</option>
        </Select>
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
            <Divider spacing="sm" />
            <div className="flex justify-between">
              <dt>translate</dt>
              <dd>{config.translate_provider} ({config.ollama_model})</dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  )
}
