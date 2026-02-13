import { Card, Select } from '@oidanice/ink-ui'
import { OllamaConfig } from './OllamaConfig'
import { OpenAIConfig } from './OpenAIConfig'
import { DeepLConfig } from './DeepLConfig'

interface TranslateConfigProps {
  translateProvider: string
  onTranslateProviderChange: (provider: string) => void
  ollamaUrl: string
  onOllamaUrlChange: (url: string) => void
  ollamaModel: string
  onOllamaModelChange: (model: string) => void
  ollamaKeepAlive: string
  onOllamaKeepAliveChange: (value: string) => void
  ollamaContextLength: string
  onOllamaContextLengthChange: (value: string) => void
  openaiUrl: string
  onOpenaiUrlChange: (url: string) => void
  openaiKey: string
  onOpenaiKeyChange: (key: string) => void
  openaiModel: string
  onOpenaiModelChange: (model: string) => void
  deepLKey: string
  onDeepLKeyChange: (key: string) => void
  deepLFree: boolean
  onDeepLFreeChange: (free: boolean) => void
}

export function TranslateConfig(props: TranslateConfigProps) {
  return (
    <Card>
      <h3 className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>translation provider</h3>
      <div className="space-y-3">
        <Select
          label="Provider"
          value={props.translateProvider}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => props.onTranslateProviderChange(e.target.value)}
        >
          <option value="local">Ollama</option>
          <option value="openai">OpenAI Compatible</option>
          <option value="deepl">DeepL</option>
        </Select>

        {props.translateProvider === 'local' && (
          <OllamaConfig
            ollamaUrl={props.ollamaUrl}
            onOllamaUrlChange={props.onOllamaUrlChange}
            ollamaModel={props.ollamaModel}
            onOllamaModelChange={props.onOllamaModelChange}
            ollamaKeepAlive={props.ollamaKeepAlive}
            onOllamaKeepAliveChange={props.onOllamaKeepAliveChange}
            ollamaContextLength={props.ollamaContextLength}
            onOllamaContextLengthChange={props.onOllamaContextLengthChange}
          />
        )}

        {props.translateProvider === 'openai' && (
          <OpenAIConfig
            openaiUrl={props.openaiUrl}
            onOpenaiUrlChange={props.onOpenaiUrlChange}
            openaiKey={props.openaiKey}
            onOpenaiKeyChange={props.onOpenaiKeyChange}
            openaiModel={props.openaiModel}
            onOpenaiModelChange={props.onOpenaiModelChange}
          />
        )}

        {props.translateProvider === 'deepl' && (
          <DeepLConfig
            deepLKey={props.deepLKey}
            onDeepLKeyChange={props.onDeepLKeyChange}
            deepLFree={props.deepLFree}
            onDeepLFreeChange={props.onDeepLFreeChange}
          />
        )}
      </div>
    </Card>
  )
}
