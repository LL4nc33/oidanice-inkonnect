import { useState, useRef, useEffect } from 'react'

const FLAGS: Record<string, string> = {
  de: '🇦🇹', en: '🇬🇧', ar: '🇸🇦', tr: '🇹🇷', ru: '🇷🇺', ja: '🇯🇵',
  zh: '🇨🇳', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹', pt: '🇵🇹', nl: '🇳🇱',
  pl: '🇵🇱', uk: '🇺🇦', fa: '🇮🇷', ko: '🇰🇷',
}

const LANGUAGES = [
  { code: '', label: 'Auto-detect', flag: '🌐' },
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'fa', label: 'فارسی' },
]

const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.code !== '')

interface LanguageSelectorProps {
  sourceLang: string
  targetLang: string
  onSourceChange: (lang: string) => void
  onTargetChange: (lang: string) => void
}

export function LanguageSelector({ sourceLang, targetLang, onSourceChange, onTargetChange }: LanguageSelectorProps) {
  const [swapped, setSwapped] = useState(false)

  const swap = () => {
    if (!sourceLang) return
    setSwapped((s) => !s)
    onSourceChange(targetLang)
    onTargetChange(sourceLang)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <LangChip
        value={sourceLang}
        onChange={onSourceChange}
        options={LANGUAGES}
        placeholder="Auto"
      />
      <button
        className="lang-swap-btn"
        onClick={swap}
        disabled={!sourceLang}
        aria-label="Swap languages"
        style={{ transform: swapped ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        ⇄
      </button>
      <LangChip
        value={targetLang}
        onChange={onTargetChange}
        options={TARGET_LANGUAGES}
      />
    </div>
  )
}

interface LangChipProps {
  value: string
  onChange: (code: string) => void
  options: typeof LANGUAGES
  placeholder?: string
}

function LangChip({ value, onChange, options, placeholder }: LangChipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const flag = value ? (FLAGS[value] ?? '🌐') : '🌐'
  const label = value ? value.toUpperCase() : (placeholder ?? 'Auto')

  return (
    <div ref={ref} className="relative">
      <button className="lang-chip" onClick={() => setOpen(!open)}>
        <span className="text-lg">{flag}</span>
        <span className="font-mono text-sm font-bold">{label}</span>
        <span className="text-xs" style={{ opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div className="lang-dropdown">
          {options.map((l) => (
            <button
              key={l.code}
              className={`lang-dropdown-item ${l.code === value ? 'lang-dropdown-item--active' : ''}`}
              onClick={() => { onChange(l.code); setOpen(false) }}
            >
              <span className="text-lg">{l.flag ?? FLAGS[l.code] ?? '🌐'}</span>
              <span>{l.label}</span>
              {l.code && <span className="font-mono text-xs" style={{ opacity: 0.5 }}>{l.code.toUpperCase()}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
