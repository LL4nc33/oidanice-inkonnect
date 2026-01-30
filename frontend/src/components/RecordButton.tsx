import { Button } from '@oidanice/ink-ui'

interface RecordButtonProps {
  isRecording: boolean
  disabled?: boolean
  onStart: () => void
  onStop: () => void
}

export function RecordButton({ isRecording, disabled, onStart, onStop }: RecordButtonProps) {
  return (
    <Button
      className={`w-full py-4 text-base ${isRecording ? 'status-active' : ''}`}
      onClick={isRecording ? onStop : onStart}
      disabled={disabled}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? '[ recording... tap to stop ]' : '[ tap to record ]'}
    </Button>
  )
}
