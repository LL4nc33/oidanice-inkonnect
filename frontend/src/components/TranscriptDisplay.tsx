import { Card, Divider } from '@oidanice/ink-ui'

interface TranscriptDisplayProps {
  originalText: string | null
  detectedLang: string | null
  translatedText: string | null
  durationMs: number | null
}

export function TranscriptDisplay({ originalText, detectedLang, translatedText, durationMs }: TranscriptDisplayProps) {
  if (!originalText) return null

  return (
    <Card className="mt-4 space-y-2">
      <div className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
        detected: {detectedLang} {durationMs !== null && `· ${(durationMs / 1000).toFixed(1)}s`}
      </div>
      <p className="font-serif text-lg leading-relaxed">{originalText}</p>
      {translatedText && (
        <>
          <Divider spacing="sm" />
          <p className="font-serif text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {translatedText}
          </p>
        </>
      )}
    </Card>
  )
}
