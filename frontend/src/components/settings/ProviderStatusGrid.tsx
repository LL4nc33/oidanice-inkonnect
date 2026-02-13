import { HealthProviderInfo } from '../../api/inkonnect'
import { ProviderStatusCard } from './ProviderStatusCard'

type ProviderStatus = 'online' | 'offline' | 'unconfigured'

interface ProviderStatusGridProps {
  providers: Record<string, HealthProviderInfo> | null
  deepLKey: string
  elevenlabsKey: string
}

function mapStatus(info: HealthProviderInfo | undefined): ProviderStatus {
  if (!info) return 'unconfigured'
  return info.status === 'ok' ? 'online' : 'offline'
}

export function ProviderStatusGrid({ providers, deepLKey, elevenlabsKey }: ProviderStatusGridProps) {
  if (!providers) return null

  const entries: { name: string; status: ProviderStatus; latencyMs?: number | null; detail?: string }[] = [
    { name: 'Whisper', status: mapStatus(providers.whisper), detail: providers.whisper ? undefined : undefined },
    { name: 'Ollama', status: mapStatus(providers.ollama), latencyMs: providers.ollama?.latency_ms },
    { name: 'Piper', status: mapStatus(providers.piper) },
    { name: 'Chatterbox', status: mapStatus(providers.chatterbox), latencyMs: providers.chatterbox?.latency_ms },
    { name: 'DeepL', status: deepLKey ? 'unconfigured' : 'unconfigured' },
    { name: 'ElevenLabs', status: elevenlabsKey ? 'unconfigured' : 'unconfigured' },
  ]

  // DeepL/ElevenLabs: if key is set, mark as "online" (we don't health-check them separately)
  if (deepLKey) entries[4].status = 'online'
  if (elevenlabsKey) entries[5].status = 'online'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {entries.map((e) => (
        <ProviderStatusCard key={e.name} {...e} />
      ))}
    </div>
  )
}
