import { useState, useCallback } from 'react'
import { MessageResponse, getMessages } from '../api/inkonnect'

export function useMessages() {
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async (sessionId: string, limit = 50, offset = 0) => {
    setLoading(true)
    try {
      const data = await getMessages(sessionId, limit, offset)
      setMessages(data.messages)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [])

  const append = useCallback((msg: MessageResponse) => {
    setMessages((prev) => [...prev, msg])
    setTotal((prev) => prev + 1)
  }, [])

  const clear = useCallback(() => {
    setMessages([])
    setTotal(0)
  }, [])

  return { messages, total, loading, fetch, append, clear }
}
