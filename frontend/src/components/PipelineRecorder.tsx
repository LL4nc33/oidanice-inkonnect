import { useEffect, useRef } from 'react'
import { Button } from '@oidanice/ink-ui'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'

interface PipelineRecorderProps {
  onProcess: (blob: Blob) => void
  disabled?: boolean
  autoStart?: boolean
  onRecordingStart?: () => void
  onRecordingChange?: (isRecording: boolean) => void
  triggerToggle?: number
}

export function PipelineRecorder({ onProcess, disabled, autoStart, onRecordingStart, onRecordingChange, triggerToggle }: PipelineRecorderProps) {
  const recorder = useVoiceRecorder()
  const processedRef = useRef<Blob | null>(null)
  const autoStarted = useRef(false)

  // Auto-start recording on mount when autoStart is true
  useEffect(() => {
    if (autoStart && !autoStarted.current && !recorder.isRecording) {
      autoStarted.current = true
      recorder.start()
      onRecordingStart?.()
    }
  }, [autoStart, recorder, onRecordingStart])

  useEffect(() => {
    onRecordingChange?.(recorder.isRecording)
  }, [recorder.isRecording, onRecordingChange])

  // Auto-process: when blob becomes available after stop, immediately process
  useEffect(() => {
    if (recorder.blob && recorder.blob !== processedRef.current) {
      processedRef.current = recorder.blob
      onProcess(recorder.blob)
      recorder.reset()
    }
  }, [recorder.blob, onProcess, recorder])

  useEffect(() => {
    if (triggerToggle === undefined || triggerToggle === 0) return
    if (recorder.isRecording) {
      recorder.stop()
    } else {
      recorder.start()
      onRecordingStart?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerToggle])

  const handleStart = () => {
    processedRef.current = null
    recorder.start()
    onRecordingStart?.()
  }

  const handleStop = () => {
    recorder.stop()
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
