import { useCallback, useRef } from 'react'
import { Button } from '@oidanice/kindle-ui'

interface SpeakButtonProps {
  audioBase64: string | null
}

export function SpeakButton({ audioBase64 }: SpeakButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(() => {
    if (!audioBase64) return
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`)
    audioRef.current = audio
    audio.play()
  }, [audioBase64])

  if (!audioBase64) return null

  return (
    <Button className="mt-2 w-full" onClick={play} aria-label="Play audio">
      [ play translation ]
    </Button>
  )
}
