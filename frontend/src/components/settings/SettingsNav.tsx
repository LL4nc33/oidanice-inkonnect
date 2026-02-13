import { FilterChip } from '@oidanice/ink-ui'

const sections = [
  { id: 'section-status', label: 'status' },
  { id: 'section-tts', label: 'tts' },
  { id: 'section-translation', label: 'translation' },
  { id: 'section-backend', label: 'backend' },
] as const

interface SettingsNavProps {
  activeSection: string
}

export function SettingsNav({ activeSection }: SettingsNavProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {sections.map((s) => (
        <FilterChip
          key={s.id}
          active={activeSection === s.id}
          onClick={() => scrollTo(s.id)}
        >
          {s.label}
        </FilterChip>
      ))}
    </div>
  )
}
