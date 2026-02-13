import { useState, useEffect } from 'react'
import { Input } from '@oidanice/ink-ui'
import { getOllamaModels } from '../../api/inkonnect'
import { SearchSelect } from '../SearchSelect'

interface OllamaConfigProps {
  ollamaUrl: string
  onOllamaUrlChange: (url: string) => void
  ollamaModel: string
  onOllamaModelChange: (model: string) => void
  ollamaKeepAlive: string
  onOllamaKeepAliveChange: (value: string) => void
  ollamaContextLength: string
  onOllamaContextLengthChange: (value: string) => void
}

export function OllamaConfig({
  ollamaUrl, onOllamaUrlChange,
  ollamaModel, onOllamaModelChange,
  ollamaKeepAlive, onOllamaKeepAliveChange,
  ollamaContextLength, onOllamaContextLengthChange,
}: OllamaConfigProps) {
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getOllamaModels(ollamaUrl || undefined)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }, [ollamaUrl])

  return (
    <>
      <Input
        label="Ollama URL"
        placeholder="http://localhost:11434"
        value={ollamaUrl}
        onChange={(e) => onOllamaUrlChange(e.target.value)}
      />
      <SearchSelect
        label={loading ? 'Model (loading...)' : 'Translation Model'}
        value={ollamaModel}
        options={models}
        placeholder="Search models..."
        onChange={onOllamaModelChange}
      />
      <Input
        label="Keep Alive"
        placeholder="3m"
        value={ollamaKeepAlive}
        onChange={(e) => onOllamaKeepAliveChange(e.target.value)}
      />
      <Input
        label="Context Length"
        placeholder="Default (model-specific)"
        value={ollamaContextLength}
        onChange={(e) => onOllamaContextLengthChange(e.target.value)}
      />
    </>
  )
}
