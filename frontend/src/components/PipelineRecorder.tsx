import { useEffect, useRef } from 'react'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { useAudioVisualizer } from '../hooks/useAudioVisualizer'
import { RecordButton } from './RecordButton'
import { AudioWaveform } from './AudioWaveform'

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
  const levels = useAudioVisualizer(recorder.stream)
  const processedRef = useRef<Blob | null>(null)
  const autoStarted = useRef(false)

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

  if (recorder.error) {
    return (
      <div className="font-mono text-sm p-3" style={{ color: 'var(--text)', border: '2px solid var(--border)' }}>
        {recorder.error}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <RecordButton
        isRecording={recorder.isRecording}
        duration={recorder.duration}
        disabled={disabled}
        onStart={handleStart}
        onStop={recorder.stop}
      />
      {recorder.isRecording && <AudioWaveform levels={levels} />}
    </div>
  )
}
