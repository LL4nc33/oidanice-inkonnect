import { MessageResponse } from '../api/inkonnect'
import { MessageBubble } from './MessageBubble'

interface MessageFeedProps {
  messages: MessageResponse[]
  sessionId: string
}

export function MessageFeed({ messages, sessionId }: MessageFeedProps) {
  if (messages.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
        conversation ({messages.length})
      </p>
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} sessionId={sessionId} />
      ))}
    </div>
  )
}
