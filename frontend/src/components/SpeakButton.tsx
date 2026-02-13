import { useCallback, useEffect, useRef } from 'react'
import { Button } from '@oidanice/ink-ui'

interface SpeakButtonProps {
  audioBase64: string | null
  autoPlay?: boolean
}

export function SpeakButton({ audioBase64, autoPlay }: SpeakButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPlayed = useRef<string | null>(null)

  const play = useCallback(() => {
    if (!audioBase64) return
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`)
    audioRef.current = audio
    audio.play()
  }, [audioBase64])

  useEffect(() => {
    if (autoPlay && audioBase64 && audioBase64 !== lastPlayed.current) {
      lastPlayed.current = audioBase64
      play()
    }
  }, [autoPlay, audioBase64, play])

  if (!audioBase64) return null

  return (
    <Button className="mt-2 w-full" onClick={play} aria-label="Play audio">
      [ play translation ]
    </Button>
  )
}
