import { useState, useRef, useCallback } from 'react'
import { Progress } from '@oidanice/ink-ui'
import { pipeline, ProviderOptions, warmupGpu, SynthesisParams } from '../api/inkonnect'
import { PipelineRecorder } from '../components/PipelineRecorder'
import { TranscriptDisplay } from '../components/TranscriptDisplay'
import { SpeakButton } from '../components/SpeakButton'
import { LanguageSelector } from '../components/LanguageSelector'
import { ErrorCard } from '../components/ErrorCard'
import { ResultActions } from '../components/ResultActions'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'

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

type Phase = 'idle' | 'processing' | 'result' | 'error'

interface Result {
  originalText: string
  detectedLang: string
  translatedText: string
  audio: string | null
  durationMs: number
}

export function Home({ sourceLang, targetLang, ttsEnabled, ttsProvider, piperVoice, chatterboxVoice, chatterboxUrl, ollamaModel, ollamaUrl, translateProvider, openaiUrl, openaiKey, openaiModel, chatterboxExaggeration, chatterboxCfgWeight, chatterboxTemperature, autoPlay, onSourceChange, onTargetChange }: HomeProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [spaceToggle, setSpaceToggle] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const lastBlob = useRef<Blob | null>(null)

  const handleRecordingChange = useCallback((recording: boolean) => {
    setStatusMessage(recording ? 'Recording started' : '')
  }, [])

  const handleSpaceToggle = useCallback(() => {
    setSpaceToggle((n) => n + 1)
  }, [])

  useKeyboardShortcut(' ', handleSpaceToggle, phase === 'idle')

  const handleProcess = async (blob: Blob) => {
    lastBlob.current = blob
    setPhase('processing')
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
        blob,
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
      setPhase('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPhase('error')
    }
  }

  const handleRetry = () => {
    if (lastBlob.current) {
      handleProcess(lastBlob.current)
    }
  }

  const handleReset = () => {
    setPhase('idle')
    setResult(null)
    setError(null)
    lastBlob.current = null
  }

  const handleRecordingStart = () => {
    setResult(null)
    setError(null)
    if (translateProvider === 'local') {
      warmupGpu('ollama').catch(() => {})
    }
  }

  return (
    <div className="space-y-4">
      <LanguageSelector
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSourceChange={onSourceChange}
        onTargetChange={onTargetChange}
      />

      {phase !== 'processing' && phase !== 'result' && phase !== 'error' && (
        <PipelineRecorder
          onProcess={handleProcess}
          disabled={false}
          onRecordingStart={handleRecordingStart}
          onRecordingChange={handleRecordingChange}
          triggerToggle={spaceToggle}
        />
      )}

      {phase === 'processing' && <Progress label="Processing..." />}

      {phase === 'error' && error && (
        <ErrorCard message={error} onRetry={handleRetry} />
      )}

      {phase === 'result' && result && (
        <>
          <TranscriptDisplay
            originalText={result.originalText}
            detectedLang={result.detectedLang}
            translatedText={result.translatedText}
            durationMs={result.durationMs}
          />
          <SpeakButton audioBase64={result.audio} autoPlay={autoPlay} />
          <ResultActions onRetry={handleRetry} onReset={handleReset} />
        </>
      )}

      <div aria-live="polite" className="sr-only">
        {statusMessage}
        {phase === 'processing' && 'Processing audio'}
        {phase === 'result' && 'Translation complete'}
        {phase === 'error' && `Error: ${error}`}
      </div>
    </div>
  )
}
