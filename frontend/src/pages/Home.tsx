import { useState, useRef, useCallback } from 'react'
import { Progress } from '@oidanice/ink-ui'
import { pipeline, ProviderOptions, warmupGpu, SynthesisParams, ElevenLabsParams, MessageResponse, createSession, updateSession } from '../api/dolmtschr'
import { PipelineRecorder } from '../components/PipelineRecorder'
import { TranscriptBubble } from '../components/TranscriptBubble'
import { LanguageSelector } from '../components/LanguageSelector'
import { ErrorCard } from '../components/ErrorCard'
import { ResultActions } from '../components/ResultActions'
import { SessionBar } from '../components/SessionBar'
import { MessageFeed } from '../components/MessageFeed'
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
  historyEnabled: boolean
  onSourceChange: (lang: string) => void
  onTargetChange: (lang: string) => void
  sessionId: string | null
  sessionTitle: string | null
  messages: MessageResponse[]
  onEndSession: () => void
  onMessageAppend: (msg: MessageResponse) => void
  onAutoSession: (id: string) => void
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

export function Home({ sourceLang, targetLang, ttsEnabled, ttsProvider, piperVoice, chatterboxVoice, chatterboxUrl, ollamaModel, ollamaUrl, translateProvider, openaiUrl, openaiKey, openaiModel, chatterboxExaggeration, chatterboxCfgWeight, chatterboxTemperature, autoPlay, ollamaKeepAlive, ollamaContextLength, deepLKey, deepLFree, elevenlabsKey, elevenlabsModel, elevenlabsVoiceId, elevenlabsStability, elevenlabsSimilarity, historyEnabled, onSourceChange, onTargetChange, sessionId, sessionTitle, messages, onEndSession, onMessageAppend, onAutoSession }: HomeProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [spaceToggle, setSpaceToggle] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [autoStart, setAutoStart] = useState(false)
  const lastBlob = useRef<Blob | null>(null)
  const autoSessionRef = useRef<string | null>(null)

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

    // Auto-create session if history enabled and no active session
    let activeSessionId = sessionId
    if (!activeSessionId && historyEnabled) {
      try {
        const s = await createSession(sourceLang || 'auto', targetLang, ttsEnabled)
        activeSessionId = s.id
        autoSessionRef.current = s.id
        onAutoSession(s.id)
      } catch {
        // Continue without session if creation fails
      }
    }

    try {
      const providerOpts = buildProviderOpts(translateProvider, openaiUrl, openaiKey, deepLKey, deepLFree)
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
        blob, sourceLang || undefined, targetLang, ttsEnabled,
        voice || undefined, model, providerOpts, activeTtsProvider, synthesisParams,
        ttsProvider === 'chatterbox' ? chatterboxUrl || undefined : undefined,
        translateProvider === 'local' ? ollamaUrl || undefined : undefined,
        translateProvider === 'local' ? ollamaKeepAlive || undefined : undefined,
        translateProvider === 'local' && ollamaContextLength ? parseInt(ollamaContextLength, 10) : undefined,
        elParams, activeSessionId || undefined,
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

      // Auto-title session with first 50 chars of original text
      if (autoSessionRef.current === activeSessionId && activeSessionId) {
        autoSessionRef.current = null
        const title = res.original_text.slice(0, 50)
        updateSession(activeSessionId, { title }).catch(() => {})
      }

      if (activeSessionId) {
        onMessageAppend({
          id: crypto.randomUUID(),
          session_id: activeSessionId,
          direction: 'source',
          original_text: res.original_text,
          translated_text: res.translated_text,
          original_lang: res.detected_language,
          translated_lang: targetLang,
          audio_path: ttsEnabled ? 'pending' : null,
          stt_ms: res.stt_ms,
          translate_ms: res.translate_ms,
          tts_ms: res.tts_ms,
          model_used: null,
          created_at: new Date().toISOString(),
        })
      }
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
    if (lastBlob.current) handleProcess(lastBlob.current)
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

  const inSession = sessionId !== null

  return (
    <div className="space-y-4">
      {inSession && (
        <SessionBar
          sessionId={sessionId}
          title={sessionTitle}
          messageCount={messages.length}
          onEnd={onEndSession}
        />
      )}

      <LanguageSelector
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSourceChange={onSourceChange}
        onTargetChange={onTargetChange}
      />

      {inSession && messages.length > 0 && (
        <MessageFeed messages={messages} sessionId={sessionId} />
      )}

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
          <TranscriptBubble
            originalText={result.originalText}
            detectedLang={result.detectedLang}
            translatedText={result.translatedText}
            targetLang={targetLang}
            audioBase64={result.audio}
            audioFormat={result.audioFormat}
            autoPlay={autoPlay}
            sttMs={result.sttMs}
            translateMs={result.translateMs}
            ttsMs={result.ttsMs}
          />
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

function buildProviderOpts(provider: string, url: string, key: string, deepLKey: string, deepLFree: boolean): ProviderOptions | undefined {
  if (provider === 'openai' && url) return { provider: 'openai', apiUrl: url, apiKey: key || undefined }
  if (provider === 'deepl' && deepLKey) return { provider: 'deepl', apiKey: deepLKey, deeplFree: deepLFree }
  return undefined
}
