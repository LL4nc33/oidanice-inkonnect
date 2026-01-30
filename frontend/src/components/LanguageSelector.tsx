import { Select, Button } from '@oidanice/ink-ui'

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
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'tr', label: 'Türkçe' },
]

const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.code !== '')

interface LanguageSelectorProps {
  sourceLang: string
  targetLang: string
  onSourceChange: (lang: string) => void
  onTargetChange: (lang: string) => void
}

export function LanguageSelector({ sourceLang, targetLang, onSourceChange, onTargetChange }: LanguageSelectorProps) {
  const swap = () => {
    if (!sourceLang) return
    onSourceChange(targetLang)
    onTargetChange(sourceLang)
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Select label="From" value={sourceLang} onChange={(e) => onSourceChange(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </Select>
      </div>
      <Button variant="ghost" className="pb-1" onClick={swap} aria-label="Swap languages" disabled={!sourceLang}>
        ⇄
      </Button>
      <div className="flex-1">
        <Select label="To" value={targetLang} onChange={(e) => onTargetChange(e.target.value)}>
          {TARGET_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </Select>
      </div>
    </div>
  )
}
