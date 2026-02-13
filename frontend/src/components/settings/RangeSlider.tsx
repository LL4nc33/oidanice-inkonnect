interface RangeSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

export function RangeSlider({ label, value, min, max, step, onChange }: RangeSliderProps) {
  return (
    <label className="flex items-center gap-2 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
      <span className="w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="flex-1"
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="w-10 text-right">{value.toFixed(2)}</span>
    </label>
  )
}
