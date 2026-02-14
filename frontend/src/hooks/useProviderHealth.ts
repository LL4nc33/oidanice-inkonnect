import { useState, useCallback } from 'react'
import { getProviderHealth, getGpuStatus, HealthResponse, GpuStatus } from '../api/dolmtschr'

interface UseProviderHealthResult {
  providers: HealthResponse['providers'] | null
  gpuStatus: GpuStatus | null
  loading: boolean
  lastUpdated: Date | null
  refresh: () => void
}

export function useProviderHealth(
  ollamaUrl?: string,
  chatterboxUrl?: string,
): UseProviderHealthResult {
  const [providers, setProviders] = useState<HealthResponse['providers'] | null>(null)
  const [gpuStatus, setGpuStatus] = useState<GpuStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    Promise.all([
      getProviderHealth(ollamaUrl || undefined, chatterboxUrl || undefined).catch(() => null),
      getGpuStatus(ollamaUrl || undefined, chatterboxUrl || undefined).catch(() => null),
    ]).then(([health, gpu]) => {
      if (health) setProviders(health.providers)
      if (gpu) setGpuStatus(gpu)
      setLastUpdated(new Date())
      setLoading(false)
    })
  }, [ollamaUrl, chatterboxUrl])

  return { providers, gpuStatus, loading, lastUpdated, refresh }
}
