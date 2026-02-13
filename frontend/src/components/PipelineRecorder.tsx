import { useEffect } from 'react'
import { Button } from '@oidanice/ink-ui'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'

interface PipelineRecorderProps {
  onProcess: (blob: Blob) => void
  disabled?: boolean
  onRecordingStart?: () => void
  onRecordingChange?: (isRecording: boolean) => void
  triggerToggle?: number
}

export function PipelineRecorder({ onProcess, disabled, onRecordingStart, onRecordingChange, triggerToggle }: PipelineRecorderProps) {
  const recorder = useVoiceRecorder()

  useEffect(() => {
    onRecordingChange?.(recorder.isRecording)
  }, [recorder.isRecording, onRecordingChange])

  useEffect(() => {
    if (triggerToggle === undefined || triggerToggle === 0) return
    if (recorder.blob) return // in preview state, don't toggle
    if (recorder.isRecording) {
      recorder.stop()
    } else {
      recorder.start()
      onRecordingStart?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerToggle])

  const handleStart = () => {
    recorder.start()
    onRecordingStart?.()
  }

  const handleStop = () => {
    recorder.stop()
  }

  const handleProcess = () => {
    if (recorder.blob) {
      onProcess(recorder.blob)
    }
  }

  const handleDiscard = () => {
    recorder.reset()
  }

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (recorder.error) {
    return (
      <div className="font-mono text-sm p-3" style={{ color: 'var(--text)', border: '2px solid var(--border)' }}>
        {recorder.error}
      </div>
    )
  }

  // Preview state: recording done, blob available
  if (recorder.blob && recorder.audioUrl) {
    return (
      <div className="space-y-3">
        <audio controls src={recorder.audioUrl} className="w-full" style={{ filter: 'grayscale(1)' }} />
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1 py-3" onClick={handleProcess} disabled={disabled}>
            [ process ]
          </Button>
          <Button variant="ghost" className="flex-1 py-3" onClick={handleDiscard} disabled={disabled}>
            [ discard ]
          </Button>
        </div>
      </div>
    )
  }

  // Recording state
  if (recorder.isRecording) {
    return (
      <Button
        className="w-full py-4 text-base status-active"
        onClick={handleStop}
        aria-label="Stop recording"
      >
        [ stop · {formatDuration(recorder.duration)} ]
      </Button>
    )
  }

  // Idle state
  return (
    <Button
      variant="primary"
      className="w-full py-4 text-base"
      onClick={handleStart}
      disabled={disabled}
      aria-label="Start recording"
    >
      [ tap to record ]
    </Button>
  )
}
