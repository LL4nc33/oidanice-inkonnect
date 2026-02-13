import { useState, useCallback } from 'react'
import { Button, Input, Progress } from '@oidanice/ink-ui'
import { SessionResponse, searchMessages } from '../api/inkonnect'
import { SidebarSessionItem } from './SidebarSessionItem'

interface ChatSidebarProps {
  sessions: SessionResponse[]
  activeSessionId: string | null
  loading: boolean
  onNewSession: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  loading,
  onNewSession,
  onSelectSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchSessionIds, setSearchSessionIds] = useState<Set<string> | null>(null)

  const filtered = searchSessionIds
    ? sessions.filter((s) => searchSessionIds.has(s.id))
    : search.trim()
      ? sessions.filter((s) => {
          const q = search.toLowerCase()
          const title = (s.title || '').toLowerCase()
          const langs = `${s.source_lang} ${s.target_lang}`.toLowerCase()
          return title.includes(q) || langs.includes(q)
        })
      : sessions

  const handleSearchKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    const q = search.trim()
    if (!q) return
    setSearching(true)
    try {
      const data = await searchMessages(q)
      const ids = new Set(data.results.map((r) => r.session_id))
      setSearchSessionIds(ids)
    } catch {
      setSearchSessionIds(null)
    } finally {
      setSearching(false)
    }
  }, [search])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setSearchSessionIds(null)
  }, [])

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      <Button variant="primary" className="w-full font-mono text-sm shrink-0" onClick={onNewSession}>
        [ + new ]
      </Button>

      <div className="shrink-0">
        <Input
          placeholder="search..."
          value={search}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      <div className="flex-1 overflow-y-auto -mx-1 space-y-1">
        {loading && <Progress label="Loading..." />}

        {!loading && filtered.length === 0 && (
          <p className="font-mono text-xs text-center py-4" style={{ color: 'var(--text-secondary)' }}>
            {search.trim() ? 'no matches' : 'no sessions yet'}
          </p>
        )}

        {!loading && filtered.map((s) => (
          <SidebarSessionItem
            key={s.id}
            session={s}
            active={s.id === activeSessionId}
            onSelect={onSelectSession}
            onDelete={onDeleteSession}
          />
        ))}

        {searching && <Progress label="Searching..." />}
      </div>
    </div>
  )
}
