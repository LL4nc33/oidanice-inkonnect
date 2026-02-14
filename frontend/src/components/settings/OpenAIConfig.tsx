import { useState, useEffect } from 'react'
import { Input } from '@oidanice/ink-ui'
import { getOpenAIModels } from '../../api/dolmtschr'
import { SearchSelect } from '../SearchSelect'

interface OpenAIConfigProps {
  openaiUrl: string
  onOpenaiUrlChange: (url: string) => void
  openaiKey: string
  onOpenaiKeyChange: (key: string) => void
  openaiModel: string
  onOpenaiModelChange: (model: string) => void
}

export function OpenAIConfig({
  openaiUrl, onOpenaiUrlChange,
  openaiKey, onOpenaiKeyChange,
  openaiModel, onOpenaiModelChange,
}: OpenAIConfigProps) {
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!openaiUrl) { setModels([]); return }
    setLoading(true)
    getOpenAIModels(openaiUrl, openaiKey)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }, [openaiUrl, openaiKey])

  return (
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
        label={loading ? 'Model (loading...)' : 'Model'}
        value={openaiModel}
        options={models}
        placeholder="Search or type model name..."
        onChange={onOpenaiModelChange}
      />
    </>
  )
}
