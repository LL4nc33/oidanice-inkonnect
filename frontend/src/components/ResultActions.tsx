import { Button } from '@oidanice/ink-ui'

interface ResultActionsProps {
  onRetry: () => void
  onReset: () => void
}

export function ResultActions({ onRetry, onReset }: ResultActionsProps) {
  return (
    <div className="flex gap-2">
      <Button className="flex-1" onClick={onRetry}>
        [ retry ]
      </Button>
      <Button variant="ghost" className="flex-1" onClick={onReset}>
        [ new recording ]
      </Button>
    </div>
  )
}
