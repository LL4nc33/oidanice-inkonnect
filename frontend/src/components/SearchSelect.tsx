import { useState, useRef, useEffect } from 'react'
import { Input } from '@oidanice/ink-ui'

interface SearchSelectProps {
  label: string
  value: string
  options: string[]
  labels?: Record<string, string>
  placeholder?: string
  onChange: (value: string) => void
}

export function SearchSelect({ label, value, options, labels, placeholder, onChange }: SearchSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const getLabel = (opt: string) => labels?.[opt] ?? opt

  const filtered = query
    ? options.filter((o) => getLabel(o).toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        label={label}
        placeholder={placeholder ?? 'Search...'}
        value={open ? query : (value ? getLabel(value) : '')}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        onBlur={() => {
          // Commit typed text as free-form value if no dropdown item was clicked
          setTimeout(() => {
            if (query && !open) onChange(query)
            setQuery('')
          }, 150)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (filtered.length === 1) {
              onChange(filtered[0])
            } else if (query) {
              onChange(query)
            }
            setQuery('')
            setOpen(false)
          }
          if (e.key === 'Escape') {
            setQuery('')
            setOpen(false)
          }
        }}
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 w-full max-h-48 overflow-y-auto font-mono text-xs"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          {filtered.map((opt) => (
            <li
              key={opt}
              className="px-3 py-2 cursor-pointer"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'var(--bg-hover, var(--border))'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'transparent'
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt)
                setQuery('')
                setOpen(false)
              }}
            >
              {getLabel(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
