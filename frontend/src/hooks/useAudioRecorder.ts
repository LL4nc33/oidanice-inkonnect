import { useState, useRef, useCallback } from 'react'

interface AudioRecorderState {
  isRecording: boolean
  blob: Blob | null
  error: string | null
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    blob: null,
    error: null,
  })
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      chunks.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType })
        stream.getTracks().forEach((t) => t.stop())
        setState({ isRecording: false, blob, error: null })
      }

      recorder.start()
      mediaRecorder.current = recorder
      setState({ isRecording: true, blob: null, error: null })
    } catch (err) {
      setState({ isRecording: false, blob: null, error: 'Microphone access denied' })
    }
  }, [])

  const stop = useCallback(() => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
    }
  }, [])

  return { ...state, start, stop }
}
