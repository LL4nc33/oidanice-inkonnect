import { useState, useEffect } from 'react'
import { Card } from '@oidanice/ink-ui'
import { getRecentBenchmarks, BenchmarkEntry } from '../../api/inkonnect'

function ms(v: number | null): string {
  if (v == null) return '--'
  return v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`
}

export function BenchmarkWidget() {
  const [entries, setEntries] = useState<BenchmarkEntry[]>([])

  useEffect(() => {
    getRecentBenchmarks(10).then(setEntries).catch(() => setEntries([]))
  }, [])

  if (entries.length === 0) return null

  const avgStt = Math.round(entries.reduce((s, e) => s + e.stt_ms, 0) / entries.length)
  const avgTranslate = Math.round(entries.reduce((s, e) => s + e.translate_ms, 0) / entries.length)
  const ttsEntries = entries.filter((e) => e.tts_ms != null)
  const avgTts = ttsEntries.length > 0 ? Math.round(ttsEntries.reduce((s, e) => s + (e.tts_ms ?? 0), 0) / ttsEntries.length) : null
  const avgTotal = Math.round(entries.reduce((s, e) => s + e.total_ms, 0) / entries.length)

  return (
    <Card>
      <h3 className="font-mono text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>recent benchmarks</h3>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-1 pr-3">stt</th>
              <th className="text-left py-1 pr-3">translate</th>
              <th className="text-left py-1 pr-3">tts</th>
              <th className="text-left py-1">total</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-1 pr-3">{ms(e.stt_ms)}</td>
                <td className="py-1 pr-3">{ms(e.translate_ms)}</td>
                <td className="py-1 pr-3">{ms(e.tts_ms)}</td>
                <td className="py-1">{ms(e.total_ms)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 600 }}>
              <td className="py-1 pr-3">avg: {ms(avgStt)}</td>
              <td className="py-1 pr-3">{ms(avgTranslate)}</td>
              <td className="py-1 pr-3">{ms(avgTts)}</td>
              <td className="py-1">{ms(avgTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
