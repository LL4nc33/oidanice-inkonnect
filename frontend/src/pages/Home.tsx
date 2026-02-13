import { useState, useEffect, useRef } from 'react'
import { Progress } from '@oidanice/ink-ui'
import { pipeline, ProviderOptions, warmupGpu, SynthesisParams } from '../api/inkonnect'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { RecordButton } from '../components/RecordButton'
import { TranscriptDisplay } from '../components/TranscriptDisplay'
import { SpeakButton } from '../components/SpeakButton'
import { LanguageSelector } from '../components/LanguageSelector'

interface HomeProps {
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
  onSourceChange: (lang: string) => void
  onTargetChange: (lang: string) => void
}

interface Result {
  originalText: string
  detectedLang: string
  translatedText: string
  audio: string | null
  durationMs: number
}

export function Home({ sourceLang, targetLang, ttsEnabled, ttsProvider, piperVoice, chatterboxVoice, chatterboxUrl, ollamaModel, ollamaUrl, translateProvider, openaiUrl, openaiKey, openaiModel, chatterboxExaggeration, chatterboxCfgWeight, chatterboxTemperature, autoPlay, onSourceChange, onTargetChange }: HomeProps) {
  const recorder = useAudioRecorder()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const processedBlob = useRef<Blob | null>(null)

  useEffect(() => {
    if (!recorder.blob || recorder.blob === processedBlob.current) return
    processedBlob.current = recorder.blob

    const process = async () => {
      setLoading(true)
      setError(null)
      try {
        const providerOpts: ProviderOptions | undefined =
          translateProvider === 'openai' && openaiUrl
            ? { provider: 'openai', apiUrl: openaiUrl, apiKey: openaiKey || undefined }
            : undefined
        const model = translateProvider === 'openai' ? openaiModel || undefined : ollamaModel || undefined
        const activeTtsProvider = ttsProvider === 'chatterbox' ? 'chatterbox' : undefined
        const synthesisParams: SynthesisParams | undefined =
          ttsProvider === 'chatterbox'
            ? { exaggeration: chatterboxExaggeration, cfgWeight: chatterboxCfgWeight, temperature: chatterboxTemperature }
            : undefined
        const res = await pipeline(
          recorder.blob!,
          sourceLang || undefined,
          targetLang,
          ttsEnabled,
          (ttsProvider === 'chatterbox' ? chatterboxVoice : piperVoice) || undefined,
          model,
          providerOpts,
          activeTtsProvider,
          synthesisParams,
          ttsProvider === 'chatterbox' ? chatterboxUrl || undefined : undefined,
          translateProvider === 'local' ? ollamaUrl || undefined : undefined,
        )
        setResult({
          originalText: res.original_text,
          detectedLang: res.detected_language,
          translatedText: res.translated_text,
          audio: res.audio,
          durationMs: res.duration_ms,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    process()
  }, [recorder.blob, sourceLang, targetLang, ttsEnabled, ttsProvider, piperVoice, chatterboxVoice, chatterboxUrl, ollamaModel, ollamaUrl, translateProvider, openaiUrl, openaiKey, openaiModel, chatterboxExaggeration, chatterboxCfgWeight, chatterboxTemperature])

  return (
    <div className="space-y-4">
      <LanguageSelector
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSourceChange={onSourceChange}
        onTargetChange={onTargetChange}
      />

      <RecordButton
        isRecording={recorder.isRecording}
        disabled={loading}
        onStart={() => {
          setResult(null)
          setError(null)
          recorder.start()
          if (translateProvider === 'local') {
            warmupGpu('ollama').catch(() => {})
          }
        }}
        onStop={() => recorder.stop()}
      />

      {loading && <Progress label="Processing..." />}

      {error && (
        <div className="font-mono text-sm p-3" style={{ color: 'var(--text)', border: '1px solid var(--border)' }}>
          error: {error}
        </div>
      )}

      {recorder.error && (
        <div className="font-mono text-sm p-3" style={{ color: 'var(--text)', border: '1px solid var(--border)' }}>
          {recorder.error}
        </div>
      )}

      <TranscriptDisplay
        originalText={result?.originalText ?? null}
        detectedLang={result?.detectedLang ?? null}
        translatedText={result?.translatedText ?? null}
        durationMs={result?.durationMs ?? null}
      />

      <SpeakButton audioBase64={result?.audio ?? null} autoPlay={autoPlay} />
    </div>
  )
}
