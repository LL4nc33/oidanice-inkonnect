import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@oidanice/ink-ui'

interface SpeakButtonProps {
  audioBase64: string | null
  autoPlay?: boolean
}

export function SpeakButton({ audioBase64, autoPlay }: SpeakButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPlayed = useRef<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback(() => {
    if (!audioBase64) return
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`)
    audio.onplay = () => setIsPlaying(true)
    audio.onpause = () => setIsPlaying(false)
    audio.onended = () => setIsPlaying(false)
    audioRef.current = audio
    audio.play()
  }, [audioBase64])

  const handleDownload = useCallback(() => {
    if (!audioBase64) return
    const link = document.createElement('a')
    link.href = `data:audio/wav;base64,${audioBase64}`
    link.download = 'translation.wav'
    link.click()
  }, [audioBase64])

  useEffect(() => {
    if (autoPlay && audioBase64 && audioBase64 !== lastPlayed.current) {
      lastPlayed.current = audioBase64
      play()
    }
  }, [autoPlay, audioBase64, play])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  if (!audioBase64) return null

  return (
    <div className="flex gap-2 mt-2">
      <Button
        className={`flex-1 ${isPlaying ? 'status-active' : ''}`}
        onClick={play}
        aria-label={isPlaying ? 'Playing audio' : 'Play audio'}
      >
        {isPlaying ? '[ playing... ]' : '[ play translation ]'}
      </Button>
      <Button variant="ghost" onClick={handleDownload} aria-label="Download audio">
        [ download ]
      </Button>
    </div>
  )
}
