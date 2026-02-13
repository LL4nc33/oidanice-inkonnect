import { Button } from '@oidanice/ink-ui'
import { SessionResponse } from '../api/inkonnect'

interface SidebarSessionItemProps {
  session: SessionResponse
  active: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function SidebarSessionItem({ session, active, onSelect, onDelete }: SidebarSessionItemProps) {
  const title = session.title || `${session.source_lang || 'auto'} → ${session.target_lang}`

  return (
    <button
      className="w-full text-left px-3 py-2 cursor-pointer border-0 rounded"
      style={{
        backgroundColor: active ? 'var(--bg-secondary)' : 'transparent',
        borderLeft: active ? '2px solid var(--text)' : '2px solid transparent',
        color: 'var(--text)',
      }}
      onClick={() => onSelect(session.id)}
    >
      <div className="flex justify-between items-center gap-1">
        <span className="font-serif text-sm leading-snug truncate">{title}</span>
        <Button
          variant="ghost"
          className="font-mono text-xs px-1 py-0 shrink-0 opacity-0 group-hover:opacity-100"
          style={{ opacity: active ? 1 : undefined }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onDelete(session.id)
          }}
        >
          x
        </Button>
      </div>
      <p className="font-mono text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
        {session.source_lang || 'auto'} → {session.target_lang}
        {' · '}
        {session.message_count} msg{session.message_count !== 1 ? 's' : ''}
        {' · '}
        {timeAgo(session.updated_at)}
      </p>
    </button>
  )
}
