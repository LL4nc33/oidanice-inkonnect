import { useState, useEffect } from 'react'
import { Card, Progress } from '@oidanice/ink-ui'
import { getDeepLUsage, getElevenLabsUsage, UsageResponse } from '../../api/inkonnect'

interface CloudUsageProps {
  deepLKey: string
  deepLFree: boolean
  elevenlabsKey: string
}

function formatNumber(n: number): string {
  return n.toLocaleString('de-DE')
}

export function CloudUsage({ deepLKey, deepLFree, elevenlabsKey }: CloudUsageProps) {
  const [deepLUsage, setDeepLUsage] = useState<UsageResponse | null>(null)
  const [elevenlabsUsage, setElevenlabsUsage] = useState<UsageResponse | null>(null)

  useEffect(() => {
    if (deepLKey) {
      getDeepLUsage(deepLKey, deepLFree).then(setDeepLUsage).catch(() => setDeepLUsage(null))
    } else {
      setDeepLUsage(null)
    }
  }, [deepLKey, deepLFree])

  useEffect(() => {
    if (elevenlabsKey) {
      getElevenLabsUsage(elevenlabsKey).then(setElevenlabsUsage).catch(() => setElevenlabsUsage(null))
    } else {
      setElevenlabsUsage(null)
    }
  }, [elevenlabsKey])

  if (!deepLUsage && !elevenlabsUsage) return null

  return (
    <Card>
      <h3 className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>cloud usage</h3>
      <div className="space-y-3">
        {deepLUsage && deepLUsage.character_limit > 0 && (
          <Progress
            value={Math.round((deepLUsage.character_count / deepLUsage.character_limit) * 100)}
            label={`deepl: ${formatNumber(deepLUsage.character_count)} / ${formatNumber(deepLUsage.character_limit)} chars`}
          />
        )}
        {elevenlabsUsage && elevenlabsUsage.character_limit > 0 && (
          <Progress
            value={Math.round((elevenlabsUsage.character_count / elevenlabsUsage.character_limit) * 100)}
            label={`elevenlabs: ${formatNumber(elevenlabsUsage.character_count)} / ${formatNumber(elevenlabsUsage.character_limit)} chars`}
          />
        )}
      </div>
    </Card>
  )
}
