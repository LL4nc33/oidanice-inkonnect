import { useState, useCallback, useEffect, useRef } from 'react'
import { useClipboard } from '../hooks/useClipboard'

interface TranscriptBubbleProps {
  originalText: string
  detectedLang: string
  translatedText: string
  targetLang: string
  audioBase64: string | null
  audioFormat: string
  autoPlay?: boolean
  sttMs: number | null
  translateMs: number | null
  ttsMs: number | null
}

export function TranscriptBubble(props: TranscriptBubbleProps) {
  return (
    <div className="space-y-3">
      <OriginalBubble text={props.originalText} lang={props.detectedLang} sttMs={props.sttMs} />
      <TranslationBubble
        text={props.translatedText}
        lang={props.targetLang}
        audioBase64={props.audioBase64}
        audioFormat={props.audioFormat}
        autoPlay={props.autoPlay}
        translateMs={props.translateMs}
        ttsMs={props.ttsMs}
      />
    </div>
  )
}

function OriginalBubble({ text, lang, sttMs }: { text: string; lang: string; sttMs: number | null }) {
  const clip = useClipboard()
  return (
    <div className="flex justify-start">
      <div className="bubble bubble--original max-w-[85%]">
        <p className="text-base leading-relaxed">{text}</p>
        <div className="bubble-footer">
          <span>{lang.toUpperCase()}{sttMs != null && ` · ${(sttMs / 1000).toFixed(1)}s STT`}</span>
          <button className="bubble-copy" onClick={() => clip.copy(text)} aria-label="Copy">
            {clip.copied ? '✓' : '⎘'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TranslationBubble({ text, lang, audioBase64, audioFormat, autoPlay, translateMs, ttsMs }: {
  text: string; lang: string; audioBase64: string | null; audioFormat: string; autoPlay?: boolean; translateMs: number | null; ttsMs: number | null
}) {
  const clip = useClipboard()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPlayed = useRef<string | null>(null)
  const [playing, setPlaying] = useState(false)

  const play = useCallback(() => {
    if (!audioBase64) return
    if (audioRef.current) audioRef.current.pause()
    const mime = audioFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav'
    const audio = new Audio(`data:${mime};base64,${audioBase64}`)
    audio.onplay = () => setPlaying(true)
    audio.onended = () => setPlaying(false)
    audio.onpause = () => setPlaying(false)
    audioRef.current = audio
    audio.play()
  }, [audioBase64, audioFormat])

  useEffect(() => {
    if (autoPlay && audioBase64 && audioBase64 !== lastPlayed.current) {
      lastPlayed.current = audioBase64
      play()
    }
  }, [autoPlay, audioBase64, play])

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  const timing = [
    translateMs != null && `${(translateMs / 1000).toFixed(1)}s translate`,
    ttsMs != null && `${(ttsMs / 1000).toFixed(1)}s TTS`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="flex justify-end">
      <div className="bubble bubble--translation max-w-[85%]">
        <div className="flex items-start gap-2">
          <p className="text-base leading-relaxed flex-1">{text}</p>
          {audioBase64 && (
            <button className="bubble-play" onClick={play} aria-label={playing ? 'Playing' : 'Play'}>
              {playing ? '⏸' : '▶'}
            </button>
          )}
        </div>
        <div className="bubble-footer">
          <span>{lang.toUpperCase()}{timing && ` · ${timing}`}</span>
          <button className="bubble-copy" onClick={() => clip.copy(text)} aria-label="Copy">
            {clip.copied ? '✓' : '⎘'}
          </button>
        </div>
      </div>
    </div>
  )
}
