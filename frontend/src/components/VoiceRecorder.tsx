import { useEffect, useRef } from 'react'
import { Button } from '@oidanice/ink-ui'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'

interface VoiceRecorderProps {
  onRecorded: (blob: Blob) => void
}

export function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const { isRecording, blob, audioUrl, duration, error, start, stop, reset } = useVoiceRecorder()
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (blob && !notifiedRef.current) {
      notifiedRef.current = true
      onRecorded(blob)
    }
  }, [blob, onRecorded])

  const handleDiscard = () => {
    notifiedRef.current = false
    reset()
  }

  const handleStart = () => {
    notifiedRef.current = false
    start()
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{error}</span>
        <Button onClick={handleStart}>[ retry ]</Button>
      </div>
    )
  }

  if (blob && audioUrl) {
    return (
      <div className="flex flex-col gap-2">
        <audio src={audioUrl} controls className="w-full" />
        <Button onClick={handleDiscard}>[ discard ]</Button>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className="flex flex-col gap-2">
        <Button className="w-full status-active" onClick={stop}>
          [ stop ]
          <span className="ml-2 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
            {duration}s
          </span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" onClick={handleStart}>[ record ]</Button>
    </div>
  )
}
