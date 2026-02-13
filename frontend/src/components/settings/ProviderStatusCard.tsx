import { Card, Badge } from '@oidanice/ink-ui'

type ProviderStatus = 'online' | 'offline' | 'unconfigured'

interface ProviderStatusCardProps {
  name: string
  status: ProviderStatus
  latencyMs?: number | null
  detail?: string
}

export function ProviderStatusCard({ name, status, latencyMs, detail }: ProviderStatusCardProps) {
  const badgeLabel = status === 'online' ? 'online' : status === 'offline' ? 'offline' : '--'

  return (
    <Card className="flex flex-col gap-1 p-3">
      <span className="font-mono text-xs font-semibold">{name}</span>
      <Badge variant={status === 'online' ? 'solid' : 'outline'}>
        {badgeLabel}
      </Badge>
      {latencyMs != null && status === 'online' && (
        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {latencyMs}ms
        </span>
      )}
      {detail && (
        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {detail}
        </span>
      )}
    </Card>
  )
}
