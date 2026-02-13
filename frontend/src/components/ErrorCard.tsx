import { Card, Button } from '@oidanice/ink-ui'

interface ErrorCardProps {
  message: string
  onRetry?: () => void
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <Card className="space-y-3">
      <p className="font-mono text-sm">error: {message}</p>
      {onRetry && (
        <Button className="w-full" onClick={onRetry}>
          [ retry ]
        </Button>
      )}
    </Card>
  )
}
