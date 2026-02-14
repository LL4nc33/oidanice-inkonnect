import { useState, useEffect, useRef } from 'react'

export function useAudioVisualizer(stream: MediaStream | null, bins = 7): number[] {
  const [levels, setLevels] = useState<number[]>(() => new Array(bins).fill(0))
  const rafRef = useRef<number>(0)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!stream) {
      setLevels(new Array(bins).fill(0))
      return
    }

    const ctx = new AudioContext()
    ctxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    source.connect(analyser)

    const data = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(data)
      // Pick evenly spaced bins from the frequency data
      const step = Math.floor(data.length / bins)
      const out: number[] = []
      for (let i = 0; i < bins; i++) {
        out.push(data[i * step] / 255)
      }
      setLevels(out)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      source.disconnect()
      ctx.close()
      ctxRef.current = null
    }
  }, [stream, bins])

  return levels
}
