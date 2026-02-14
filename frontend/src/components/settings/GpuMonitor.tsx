import { Card, Progress, Button } from '@oidanice/ink-ui'
import { GpuStatus } from '../../api/dolmtschr'

interface GpuMonitorProps {
  gpuStatus: GpuStatus | null
  loading: boolean
  lastUpdated: Date | null
  onRefresh: () => void
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(1)} GB`
}

export function GpuMonitor({ gpuStatus, loading, lastUpdated, onRefresh }: GpuMonitorProps) {
  if (!gpuStatus) return null

  const ollamaModels = gpuStatus.ollama.models ?? []
  const hasOllamaError = 'error' in gpuStatus.ollama
  const chatterboxAllocated = gpuStatus.chatterbox.gpu_allocated_mb ?? 0
  const chatterboxReserved = gpuStatus.chatterbox.gpu_reserved_mb ?? 0
  const hasChatterboxError = 'error' in gpuStatus.chatterbox
  const chatterboxPct = chatterboxReserved > 0 ? Math.round((chatterboxAllocated / chatterboxReserved) * 100) : 0

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : '--:--'

  return (
    <Card>
      <h3 className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>gpu monitor</h3>

      <div className="space-y-2 font-mono text-xs">
        {hasOllamaError ? (
          <p style={{ color: 'var(--text-secondary)' }}>ollama: unreachable</p>
        ) : ollamaModels.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>ollama: no models loaded</p>
        ) : (
          ollamaModels.map((m) => (
            <div key={m.name}>
              <span>ollama: {m.name}</span>
              <span style={{ color: 'var(--text-secondary)' }}> · {formatBytes(m.size_vram)} VRAM</span>
            </div>
          ))
        )}

        {hasChatterboxError ? (
          <p style={{ color: 'var(--text-secondary)' }}>chatterbox: unreachable</p>
        ) : chatterboxReserved > 0 ? (
          <Progress
            value={chatterboxPct}
            label={`chatterbox: ${(chatterboxAllocated / 1024).toFixed(1)} / ${(chatterboxReserved / 1024).toFixed(1)} GB`}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          last checked: {timeStr}
        </span>
        <Button onClick={onRefresh} disabled={loading}>
          {loading ? '...' : 'refresh'}
        </Button>
      </div>
    </Card>
  )
}
