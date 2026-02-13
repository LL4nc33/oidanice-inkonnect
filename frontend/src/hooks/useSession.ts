import { useState, useRef, useCallback } from 'react'
import { SessionResponse, createSession, getSession } from '../api/inkonnect'

export function useSession() {
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const pendingCreate = useRef<Promise<SessionResponse> | null>(null)

  const create = useCallback(async (sourceLang: string, targetLang: string, ttsEnabled: boolean) => {
    if (pendingCreate.current) return pendingCreate.current
    setLoading(true)
    const promise = createSession(sourceLang, targetLang, ttsEnabled)
    pendingCreate.current = promise
    try {
      const s = await promise
      setSession(s)
      return s
    } finally {
      pendingCreate.current = null
      setLoading(false)
    }
  }, [])

  const load = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const s = await getSession(id)
      setSession(s)
      return s
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setSession(null)
    pendingCreate.current = null
  }, [])

  return { session, loading, create, load, clear }
}
