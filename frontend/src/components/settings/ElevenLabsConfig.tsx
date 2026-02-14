import { useState, useEffect } from 'react'
import { Input, Select } from '@oidanice/ink-ui'
import { getElevenLabsVoices, ElevenLabsVoice } from '../../api/dolmtschr'
import { SearchSelect } from '../SearchSelect'
import { RangeSlider } from './RangeSlider'

interface ElevenLabsConfigProps {
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

export function ElevenLabsConfig({
  elevenlabsKey, onElevenlabsKeyChange,
  elevenlabsModel, onElevenlabsModelChange,
  elevenlabsVoiceId, onElevenlabsVoiceIdChange,
  elevenlabsStability, onElevenlabsStabilityChange,
  elevenlabsSimilarity, onElevenlabsSimilarityChange,
}: ElevenLabsConfigProps) {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!elevenlabsKey) { setVoices([]); return }
    setLoading(true)
    getElevenLabsVoices(elevenlabsKey)
      .then(setVoices)
      .catch(() => setVoices([]))
      .finally(() => setLoading(false))
  }, [elevenlabsKey])

  return (
    <>
      <Input
        label="API Key"
        type="password"
        placeholder="xi-..."
        value={elevenlabsKey}
        onChange={(e) => onElevenlabsKeyChange(e.target.value)}
      />
      <SearchSelect
        label={loading ? 'Voice (loading...)' : 'Voice'}
        value={elevenlabsVoiceId}
        options={voices.map((v) => v.id)}
        labels={voices.reduce<Record<string, string>>((acc, v) => { acc[v.id] = v.name; return acc }, {})}
        placeholder="Select voice..."
        onChange={onElevenlabsVoiceIdChange}
      />
      <Select
        label="Model"
        value={elevenlabsModel}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onElevenlabsModelChange(e.target.value)}
      >
        <option value="eleven_multilingual_v2">Multilingual v2</option>
        <option value="eleven_turbo_v2_5">Turbo v2.5</option>
      </Select>
      <div className="space-y-2 mt-2">
        <RangeSlider label="stability" value={elevenlabsStability} min={0.0} max={1.0} step={0.05} onChange={onElevenlabsStabilityChange} />
        <RangeSlider label="similarity" value={elevenlabsSimilarity} min={0.0} max={1.0} step={0.05} onChange={onElevenlabsSimilarityChange} />
      </div>
    </>
  )
}
