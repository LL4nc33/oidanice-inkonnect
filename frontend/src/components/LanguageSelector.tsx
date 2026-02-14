import { useState, useRef, useEffect } from 'react'

// Inline SVG flag components — consistent across platforms, no emoji rendering issues
function FlagSvg({ code, size = 24 }: { code: string; size?: number }) {
  const w = size
  const h = Math.round(size * 0.7)
  const style = { width: w, height: h, display: 'inline-block', verticalAlign: 'middle' }

  // Simple flag representations using horizontal stripes / known patterns
  const flags: Record<string, JSX.Element> = {
    at: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="7" fill="#ed2939" />
        <rect y="7" width="30" height="6" fill="#fff" />
        <rect y="13" width="30" height="7" fill="#ed2939" />
      </svg>
    ),
    gb: (
      <svg viewBox="0 0 60 30" style={style}>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0 0L60 30M60 0L0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0L60 30M60 0L0 30" stroke="#C8102E" strokeWidth="4" />
        <path d="M30 0V30M0 15H60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0V30M0 15H60" stroke="#C8102E" strokeWidth="6" />
      </svg>
    ),
    sa: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="20" fill="#006C35" />
        <text x="15" y="12" textAnchor="middle" fill="#fff" fontSize="6" fontFamily="serif">&#1604;&#1575;</text>
      </svg>
    ),
    tr: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="20" fill="#E30A17" />
        <circle cx="11" cy="10" r="6" fill="#fff" />
        <circle cx="13" cy="10" r="5" fill="#E30A17" />
        <polygon points="17,10 14.5,8.5 14.5,11.5 17,10 14,7.5 14,12.5" fill="#fff" />
      </svg>
    ),
    ru: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="7" fill="#fff" />
        <rect y="7" width="30" height="6" fill="#0039A6" />
        <rect y="13" width="30" height="7" fill="#D52B1E" />
      </svg>
    ),
    jp: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="20" fill="#fff" />
        <circle cx="15" cy="10" r="6" fill="#BC002D" />
      </svg>
    ),
    cn: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="20" fill="#DE2910" />
        <polygon points="5,3 6.2,6.7 3,5 7,5 3.8,6.7" fill="#FFDE00" />
      </svg>
    ),
    fr: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="10" height="20" fill="#002395" />
        <rect x="10" width="10" height="20" fill="#fff" />
        <rect x="20" width="10" height="20" fill="#ED2939" />
      </svg>
    ),
    es: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="5" fill="#AA151B" />
        <rect y="5" width="30" height="10" fill="#F1BF00" />
        <rect y="15" width="30" height="5" fill="#AA151B" />
      </svg>
    ),
    it: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="10" height="20" fill="#009246" />
        <rect x="10" width="10" height="20" fill="#fff" />
        <rect x="20" width="10" height="20" fill="#CE2B37" />
      </svg>
    ),
    pt: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="12" height="20" fill="#006600" />
        <rect x="12" width="18" height="20" fill="#FF0000" />
        <circle cx="12" cy="10" r="4" fill="#FFCC00" stroke="#006600" strokeWidth="0.5" />
      </svg>
    ),
    nl: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="7" fill="#AE1C28" />
        <rect y="7" width="30" height="6" fill="#fff" />
        <rect y="13" width="30" height="7" fill="#21468B" />
      </svg>
    ),
    pl: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="10" fill="#fff" />
        <rect y="10" width="30" height="10" fill="#DC143C" />
      </svg>
    ),
    ua: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="10" fill="#005BBB" />
        <rect y="10" width="30" height="10" fill="#FFD500" />
      </svg>
    ),
    ir: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="7" fill="#239F40" />
        <rect y="7" width="30" height="6" fill="#fff" />
        <rect y="13" width="30" height="7" fill="#DA0000" />
      </svg>
    ),
    kr: (
      <svg viewBox="0 0 30 20" style={style}>
        <rect width="30" height="20" fill="#fff" />
        <circle cx="15" cy="10" r="5" fill="#C60C30" />
        <path d="M15 5 Q20 10 15 15 Q10 10 15 5" fill="#003478" />
      </svg>
    ),
  }

  // Map language codes to country codes
  const langToCountry: Record<string, string> = {
    de: 'at', en: 'gb', ar: 'sa', tr: 'tr', ru: 'ru', ja: 'jp',
    zh: 'cn', fr: 'fr', es: 'es', it: 'it', pt: 'pt', nl: 'nl',
    pl: 'pl', uk: 'ua', fa: 'ir', ko: 'kr',
  }

  const countryCode = langToCountry[code]
  if (countryCode && flags[countryCode]) return flags[countryCode]

  // Fallback: monospace text label
  return (
    <span
      style={{
        ...style,
        background: 'var(--bg-secondary, rgba(0,0,0,0.05))',
        fontSize: 9,
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 700,
        textAlign: 'center',
        lineHeight: `${h}px`,
      }}
    >
      {code.toUpperCase()}
    </span>
  )
}

function GlobeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" style={{ verticalAlign: 'middle' }}>
      <circle cx="10" cy="10" r="8" />
      <ellipse cx="10" cy="10" rx="4" ry="8" />
      <line x1="2" y1="10" x2="18" y2="10" />
    </svg>
  )
}

const LANGUAGES = [
  { code: '', label: 'Auto-detect' },
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

  const label = value ? value.toUpperCase() : (placeholder ?? 'Auto')

  return (
    <div ref={ref} className="relative">
      <button className="lang-chip" onClick={() => setOpen(!open)}>
        {value ? <FlagSvg code={value} size={24} /> : <GlobeIcon size={22} />}
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
              {l.code ? <FlagSvg code={l.code} size={22} /> : <GlobeIcon size={20} />}
              <span>{l.label}</span>
              {l.code && <span className="font-mono text-xs" style={{ opacity: 0.5 }}>{l.code.toUpperCase()}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
