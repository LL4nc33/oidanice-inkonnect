import { useState, useEffect, useCallback } from 'react'
import { Input, Divider } from '@oidanice/ink-ui'
import { getChatterboxVoices, ChatterboxVoice } from '../../api/dolmtschr'
import { SearchSelect } from '../SearchSelect'
import { ChatterboxVoiceManager } from '../ChatterboxVoiceManager'
import { RangeSlider } from './RangeSlider'

interface ChatterboxConfigProps {
  chatterboxVoice: string
  onChatterboxVoiceChange: (voice: string) => void
  chatterboxUrl: string
  onChatterboxUrlChange: (url: string) => void
  exaggeration: number
  onExaggerationChange: (v: number) => void
  cfgWeight: number
  onCfgWeightChange: (v: number) => void
  temperature: number
  onTemperatureChange: (v: number) => void
}

export function ChatterboxConfig({
  chatterboxVoice, onChatterboxVoiceChange,
  chatterboxUrl, onChatterboxUrlChange,
  exaggeration, onExaggerationChange,
  cfgWeight, onCfgWeightChange,
  temperature, onTemperatureChange,
}: ChatterboxConfigProps) {
  const [voices, setVoices] = useState<ChatterboxVoice[]>([])
  const [loading, setLoading] = useState(false)

  const loadVoices = useCallback(() => {
    setLoading(true)
    getChatterboxVoices(chatterboxUrl || undefined)
      .then(setVoices)
      .catch(() => setVoices([]))
      .finally(() => setLoading(false))
  }, [chatterboxUrl])

  useEffect(() => { loadVoices() }, [loadVoices])

  return (
    <>
      <Input
        label="Chatterbox URL"
        placeholder="http://gpu00.node:4123"
        value={chatterboxUrl}
        onChange={(e) => onChatterboxUrlChange(e.target.value)}
      />
      <SearchSelect
        label={loading ? 'Voice (loading...)' : 'Voice'}
        value={chatterboxVoice}
        options={voices.map((v) => v.name)}
        placeholder="Select voice..."
        onChange={onChatterboxVoiceChange}
      />
      <div className="space-y-2 mt-2">
        <RangeSlider label="exaggeration" value={exaggeration} min={0.25} max={2.0} step={0.05} onChange={onExaggerationChange} />
        <RangeSlider label="cfg_weight" value={cfgWeight} min={0.0} max={1.0} step={0.05} onChange={onCfgWeightChange} />
        <RangeSlider label="temperature" value={temperature} min={0.05} max={5.0} step={0.05} onChange={onTemperatureChange} />
      </div>
      <Divider spacing="sm" />
      <ChatterboxVoiceManager
        selectedVoice={chatterboxVoice}
        onVoiceChange={onChatterboxVoiceChange}
        onVoicesChanged={loadVoices}
        chatterboxUrl={chatterboxUrl}
      />
    </>
  )
}
