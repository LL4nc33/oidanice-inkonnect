import { useRef } from 'react'

interface RecordButtonProps {
  isRecording: boolean
  duration: number
  disabled?: boolean
  onStart: () => void
  onStop: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function vibrate() {
  if (navigator.vibrate) navigator.vibrate([50])
}

export function RecordButton({ isRecording, duration, disabled, onStart, onStop }: RecordButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    vibrate()
    if (isRecording) {
      onStop()
    } else {
      onStart()
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="record-btn-wrapper">
        {isRecording && <div className="record-ripple" />}
        <button
          ref={btnRef}
          className={`record-btn ${isRecording ? 'record-btn--active' : 'record-btn--idle'}`}
          onClick={handleClick}
          disabled={disabled}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? (
            <div className="flex flex-col items-center gap-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <span className="text-xs font-mono">{formatDuration(duration)}</span>
            </div>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
