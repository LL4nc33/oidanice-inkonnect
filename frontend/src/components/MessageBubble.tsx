import { useState, useRef, useCallback } from 'react'
import { Card, Button, Divider } from '@oidanice/ink-ui'
import { MessageResponse, getMessageAudioUrl } from '../api/dolmtschr'
import { useClipboard } from '../hooks/useClipboard'

interface MessageBubbleProps {
  message: MessageResponse
  sessionId: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, sessionId }: MessageBubbleProps) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const clip = useClipboard()

  const handlePlay = useCallback(() => {
    if (!message.audio_path) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    const url = getMessageAudioUrl(sessionId, message.id)
    const audio = new Audio(url)
    audio.onplay = () => setPlaying(true)
    audio.onpause = () => setPlaying(false)
    audio.onended = () => setPlaying(false)
    audioRef.current = audio
    audio.play()
  }, [message.audio_path, message.id, sessionId])

  const copyText = message.translated_text || message.original_text

  return (
    <Card className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {message.original_lang} → {message.translated_lang} · {formatTime(message.created_at)}
        </span>
        <div className="flex gap-1">
          {message.audio_path && (
            <Button variant="ghost" className="font-mono text-xs px-2 py-0" onClick={handlePlay}>
              {playing ? '[ ... ]' : '[ play ]'}
            </Button>
          )}
          <Button variant="ghost" className="font-mono text-xs px-2 py-0" onClick={() => clip.copy(copyText)}>
            {clip.copied ? '[ ok ]' : '[ copy ]'}
          </Button>
        </div>
      </div>
      <p className="font-serif text-base leading-relaxed">{message.original_text}</p>
      {message.translated_text && (
        <>
          <Divider spacing="sm" />
          <p className="font-serif text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {message.translated_text}
          </p>
        </>
      )}
    </Card>
  )
}
