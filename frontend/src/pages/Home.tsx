import { useState, useRef, useCallback } from 'react'
import { Progress } from '@oidanice/ink-ui'
import { pipeline, ProviderOptions, warmupGpu, SynthesisParams, ElevenLabsParams } from '../api/inkonnect'
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
  ollamaKeepAlive: string
  ollamaContextLength: string
  deepLKey: string
  deepLFree: boolean
  elevenlabsKey: string
  elevenlabsModel: string
  elevenlabsVoiceId: string
  elevenlabsStability: number
  elevenlabsSimilarity: number
  onSourceChange: (lang: string) => void
  onTargetChange: (lang: string) => void
}

type Phase = 'idle' | 'processing' | 'result' | 'error'

interface Result {
  originalText: string
  detectedLang: string
  translatedText: string
  audio: string | null
  audioFormat: string
  durationMs: number
  sttMs: number | null
  translateMs: number | null
  ttsMs: number | null
}

export function Home({ sourceLang, targetLang, ttsEnabled, ttsProvider, piperVoice, chatterboxVoice, chatterboxUrl, ollamaModel, ollamaUrl, translateProvider, openaiUrl, openaiKey, openaiModel, chatterboxExaggeration, chatterboxCfgWeight, chatterboxTemperature, autoPlay, ollamaKeepAlive, ollamaContextLength, deepLKey, deepLFree, elevenlabsKey, elevenlabsModel, elevenlabsVoiceId, elevenlabsStability, elevenlabsSimilarity, onSourceChange, onTargetChange }: HomeProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [spaceToggle, setSpaceToggle] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [autoStart, setAutoStart] = useState(false)
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
      let providerOpts: ProviderOptions | undefined
      if (translateProvider === 'openai' && openaiUrl) {
        providerOpts = { provider: 'openai', apiUrl: openaiUrl, apiKey: openaiKey || undefined }
      } else if (translateProvider === 'deepl' && deepLKey) {
        providerOpts = { provider: 'deepl', apiKey: deepLKey, deeplFree: deepLFree }
      }
      const model = translateProvider === 'openai' ? openaiModel || undefined : ollamaModel || undefined
      const activeTtsProvider = ttsProvider === 'chatterbox' ? 'chatterbox'
        : ttsProvider === 'elevenlabs' ? 'elevenlabs' : undefined
      const synthesisParams: SynthesisParams | undefined =
        ttsProvider === 'chatterbox'
          ? { exaggeration: chatterboxExaggeration, cfgWeight: chatterboxCfgWeight, temperature: chatterboxTemperature }
          : undefined
      const elParams: ElevenLabsParams | undefined =
        ttsProvider === 'elevenlabs'
          ? { key: elevenlabsKey, voiceId: elevenlabsVoiceId, model: elevenlabsModel, stability: elevenlabsStability, similarity: elevenlabsSimilarity }
          : undefined
      const voice = ttsProvider === 'chatterbox' ? chatterboxVoice
        : ttsProvider === 'elevenlabs' ? undefined : piperVoice
      const res = await pipeline(
        blob,
        sourceLang || undefined,
        targetLang,
        ttsEnabled,
        voice || undefined,
        model,
        providerOpts,
        activeTtsProvider,
        synthesisParams,
        ttsProvider === 'chatterbox' ? chatterboxUrl || undefined : undefined,
        translateProvider === 'local' ? ollamaUrl || undefined : undefined,
        translateProvider === 'local' ? ollamaKeepAlive || undefined : undefined,
        translateProvider === 'local' && ollamaContextLength ? parseInt(ollamaContextLength, 10) : undefined,
        elParams,
      )
      setResult({
        originalText: res.original_text,
        detectedLang: res.detected_language,
        translatedText: res.translated_text,
        audio: res.audio,
        audioFormat: res.audio_format || 'wav',
        durationMs: res.duration_ms,
        sttMs: res.stt_ms,
        translateMs: res.translate_ms,
        ttsMs: res.tts_ms,
      })
      setPhase('result')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('No speech detected')) {
        setPhase('idle')
        lastBlob.current = null
        return
      }
      setError(msg || 'Unknown error')
      setPhase('error')
    }
  }

  const handleRetry = () => {
    if (lastBlob.current) {
      handleProcess(lastBlob.current)
    }
  }

  const handleReset = () => {
    setAutoStart(true)
    setPhase('idle')
    setResult(null)
    setError(null)
    lastBlob.current = null
  }

  const handleRecordingStart = () => {
    setAutoStart(false)
    setResult(null)
    setError(null)
    if (translateProvider === 'local') {
      warmupGpu('ollama', ollamaUrl || undefined, ollamaKeepAlive || undefined).catch(() => {})
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
          autoStart={autoStart}
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
            sttMs={result.sttMs}
            translateMs={result.translateMs}
            ttsMs={result.ttsMs}
          />
          <SpeakButton audioBase64={result.audio} audioFormat={result.audioFormat} autoPlay={autoPlay} />
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
