interface AudioWaveformProps {
  levels: number[]
}

export function AudioWaveform({ levels }: AudioWaveformProps) {
  return (
    <div className="flex items-end justify-center gap-1" style={{ height: 30 }}>
      {levels.map((level, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 4,
            height: Math.max(4, level * 30),
            backgroundColor: level > 0.5 ? 'var(--primary)' : 'var(--text-secondary)',
            transition: 'height 0.08s ease-out',
            opacity: 0.6 + level * 0.4,
          }}
        />
      ))}
    </div>
  )
}
