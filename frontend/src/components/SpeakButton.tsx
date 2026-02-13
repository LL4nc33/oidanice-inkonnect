import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@oidanice/ink-ui'

interface SpeakButtonProps {
  audioBase64: string | null
  audioFormat?: string
  autoPlay?: boolean
}

export function SpeakButton({ audioBase64, audioFormat = 'wav', autoPlay }: SpeakButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPlayed = useRef<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback(() => {
    if (!audioBase64) return
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const mime = audioFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav'
    const audio = new Audio(`data:${mime};base64,${audioBase64}`)
    audio.onplay = () => setIsPlaying(true)
    audio.onpause = () => setIsPlaying(false)
    audio.onended = () => setIsPlaying(false)
    audioRef.current = audio
    audio.play()
  }, [audioBase64, audioFormat])

  const handleDownload = useCallback(() => {
    if (!audioBase64) return
    const mime = audioFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav'
    const ext = audioFormat === 'mp3' ? 'mp3' : 'wav'
    const link = document.createElement('a')
    link.href = `data:${mime};base64,${audioBase64}`
    link.download = `translation.${ext}`
    link.click()
  }, [audioBase64, audioFormat])

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
