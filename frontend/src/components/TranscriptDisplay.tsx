import { Card, Divider, Button } from '@oidanice/ink-ui'
import { useClipboard } from '../hooks/useClipboard'

interface TranscriptDisplayProps {
  originalText: string | null
  detectedLang: string | null
  translatedText: string | null
  durationMs: number | null
}

export function TranscriptDisplay({ originalText, detectedLang, translatedText, durationMs }: TranscriptDisplayProps) {
  const originalClip = useClipboard()
  const translatedClip = useClipboard()

  if (!originalText) return null

  return (
    <Card className="mt-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          detected: {detectedLang} {durationMs !== null && `· ${(durationMs / 1000).toFixed(1)}s`}
        </span>
        <Button variant="ghost" className="font-mono text-xs px-2 py-1" onClick={() => originalClip.copy(originalText)}>
          {originalClip.copied ? '[ copied ]' : '[ copy ]'}
        </Button>
      </div>
      <p className="font-serif text-lg leading-relaxed">{originalText}</p>
      {translatedText && (
        <>
          <Divider spacing="sm" />
          <div className="flex justify-between items-start gap-2">
            <p className="font-serif text-lg leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>
              {translatedText}
            </p>
            <Button variant="ghost" className="font-mono text-xs px-2 py-1 shrink-0" onClick={() => translatedClip.copy(translatedText)}>
              {translatedClip.copied ? '[ copied ]' : '[ copy ]'}
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
