import { Card, Select, Divider } from '@oidanice/ink-ui'
import { PiperConfig } from './PiperConfig'
import { ChatterboxConfig } from './ChatterboxConfig'
import { ElevenLabsConfig } from './ElevenLabsConfig'

interface TTSConfigProps {
  ttsEnabled: boolean
  onTtsChange: (enabled: boolean) => void
  autoPlay: boolean
  onAutoPlayChange: (enabled: boolean) => void
  ttsProvider: string
  onTtsProviderChange: (provider: string) => void
  piperVoice: string
  onPiperVoiceChange: (voice: string) => void
  chatterboxVoice: string
  onChatterboxVoiceChange: (voice: string) => void
  chatterboxUrl: string
  onChatterboxUrlChange: (url: string) => void
  chatterboxExaggeration: number
  onChatterboxExaggerationChange: (v: number) => void
  chatterboxCfgWeight: number
  onChatterboxCfgWeightChange: (v: number) => void
  chatterboxTemperature: number
  onChatterboxTemperatureChange: (v: number) => void
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

export function TTSConfig(props: TTSConfigProps) {
  return (
    <Card>
      <h3 className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>text-to-speech</h3>
      <div className="space-y-3">
        <Select
          label="TTS Output"
          value={props.ttsEnabled ? 'on' : 'off'}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => props.onTtsChange(e.target.value === 'on')}
        >
          <option value="on">Enabled</option>
          <option value="off">Disabled</option>
        </Select>

        <Select
          label="Auto-Play"
          value={props.autoPlay ? 'on' : 'off'}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => props.onAutoPlayChange(e.target.value === 'on')}
        >
          <option value="on">Enabled</option>
          <option value="off">Disabled</option>
        </Select>

        {props.ttsEnabled && (
          <>
            <Select
              label="TTS Provider"
              value={props.ttsProvider}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => props.onTtsProviderChange(e.target.value)}
            >
              <option value="piper">Piper</option>
              <option value="chatterbox">Chatterbox</option>
              <option value="elevenlabs">ElevenLabs</option>
            </Select>

            <Divider spacing="sm" />

            {props.ttsProvider === 'piper' && (
              <PiperConfig piperVoice={props.piperVoice} onPiperVoiceChange={props.onPiperVoiceChange} />
            )}

            {props.ttsProvider === 'chatterbox' && (
              <ChatterboxConfig
                chatterboxVoice={props.chatterboxVoice}
                onChatterboxVoiceChange={props.onChatterboxVoiceChange}
                chatterboxUrl={props.chatterboxUrl}
                onChatterboxUrlChange={props.onChatterboxUrlChange}
                exaggeration={props.chatterboxExaggeration}
                onExaggerationChange={props.onChatterboxExaggerationChange}
                cfgWeight={props.chatterboxCfgWeight}
                onCfgWeightChange={props.onChatterboxCfgWeightChange}
                temperature={props.chatterboxTemperature}
                onTemperatureChange={props.onChatterboxTemperatureChange}
              />
            )}

            {props.ttsProvider === 'elevenlabs' && (
              <ElevenLabsConfig
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
            )}
          </>
        )}
      </div>
    </Card>
  )
}
