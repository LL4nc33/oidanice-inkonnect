import { useState, useRef, useCallback, useEffect } from 'react'

interface VoiceRecorderState {
  isRecording: boolean
  blob: Blob | null
  audioUrl: string | null
  duration: number
  error: string | null
}

const INITIAL_STATE: VoiceRecorderState = {
  isRecording: false,
  blob: null,
  audioUrl: null,
  duration: 0,
  error: null,
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>(INITIAL_STATE)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const revokeUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    try {
      revokeUrl()

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
        clearTimer()
        const blob = new Blob(chunks.current, { type: recorder.mimeType })
        stream.getTracks().forEach((t) => t.stop())
        const url = URL.createObjectURL(blob)
        audioUrlRef.current = url
        setState((prev) => ({
          ...prev,
          isRecording: false,
          blob,
          audioUrl: url,
          error: null,
        }))
      }

      recorder.start()
      mediaRecorder.current = recorder

      setState({ isRecording: true, blob: null, audioUrl: null, duration: 0, error: null })

      timerRef.current = setInterval(() => {
        setState((prev) => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
    } catch {
      setState({ ...INITIAL_STATE, error: 'Microphone access denied' })
    }
  }, [clearTimer, revokeUrl])

  const stop = useCallback(() => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
    }
  }, [])

  const reset = useCallback(() => {
    revokeUrl()
    setState(INITIAL_STATE)
  }, [revokeUrl])

  useEffect(() => {
    return () => {
      clearTimer()
      revokeUrl()
    }
  }, [clearTimer, revokeUrl])

  return { ...state, start, stop, reset }
}
