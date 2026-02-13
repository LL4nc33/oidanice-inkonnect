import { useState, useEffect, useCallback } from 'react'
import { Layout, DarkModeToggle, InstallPrompt, Button } from '@oidanice/ink-ui'
import { useSettings } from './hooks/useSettings'
import { useSession } from './hooks/useSession'
import { useMessages } from './hooks/useMessages'
import { getMessages, listSessions, deleteSession, SessionResponse } from './api/inkonnect'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'
import { ChatSidebar } from './components/ChatSidebar'
import { Footer } from './components/Footer'

type Page = 'home' | 'settings'

export function App() {
  const [page, setPage] = useState<Page>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const { settings, update } = useSettings()
  const { session, create: createSession, load: loadSession, clear: clearSession } = useSession()
  const { messages, append: appendMessage, clear: clearMessages } = useMessages()

  const refreshSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const data = await listSessions(50)
      setSessions(data.sessions)
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSessions()
  }, [refreshSessions])

  const handleNewSession = useCallback(async () => {
    const s = await createSession(
      settings.sourceLang,
      settings.targetLang,
      settings.ttsEnabled,
    )
    if (s) {
      clearMessages()
      await refreshSessions()
      setPage('home')
      setSidebarOpen(false)
    }
  }, [createSession, settings.sourceLang, settings.targetLang, settings.ttsEnabled, clearMessages, refreshSessions])

  const handleSelectSession = useCallback(async (id: string) => {
    await loadSession(id)
    const data = await getMessages(id)
    clearMessages()
    data.messages.forEach(appendMessage)
    setPage('home')
    setSidebarOpen(false)
  }, [loadSession, clearMessages, appendMessage])

  const handleDeleteSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (session?.id === id) {
      clearSession()
      clearMessages()
    }
    try {
      await deleteSession(id)
    } catch {
      refreshSessions()
    }
  }, [session?.id, clearSession, clearMessages, refreshSessions])

  const handleEndSession = useCallback(() => {
    clearSession()
    clearMessages()
  }, [clearSession, clearMessages])

  const sidebar = (
    <ChatSidebar
      sessions={sessions}
      activeSessionId={session?.id ?? null}
      loading={sessionsLoading}
      onNewSession={handleNewSession}
      onSelectSession={handleSelectSession}
      onDeleteSession={handleDeleteSession}
    />
  )

  return (
    <>
      <Layout
        headerLeft={
          <button
            className="md:hidden border-0 bg-transparent cursor-pointer p-1 font-mono text-base"
            style={{ color: 'var(--text)' }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            [=]
          </button>
        }
        title="inkonnect"
        headerRight={
          <div className="flex items-center gap-3">
            <Button
              variant={page === 'home' ? 'primary' : 'ghost'}
              className="text-xs"
              onClick={() => setPage('home')}
            >
              [ home ]
            </Button>
            <Button
              variant={page === 'settings' ? 'primary' : 'ghost'}
              className="text-xs"
              onClick={() => setPage('settings')}
            >
              [ settings ]
            </Button>
            <DarkModeToggle />
          </div>
        }
        banner={<InstallPrompt />}
        footer={<Footer />}
        sidebar={sidebar}
        sidebarPosition="left"
        sidebarWidth="w-64"
        sidebarClassName="hidden md:block"
        maxWidth=""
      >
        <div className="max-w-4xl mx-auto">
          {page === 'home' && (
            <Home
              sourceLang={settings.sourceLang}
              targetLang={settings.targetLang}
              ttsEnabled={settings.ttsEnabled}
              ttsProvider={settings.ttsProvider}
              piperVoice={settings.piperVoice}
              chatterboxVoice={settings.chatterboxVoice}
              chatterboxUrl={settings.chatterboxUrl}
              ollamaModel={settings.ollamaModel}
              ollamaUrl={settings.ollamaUrl}
              translateProvider={settings.translateProvider}
              openaiUrl={settings.openaiUrl}
              openaiKey={settings.openaiKey}
              openaiModel={settings.openaiModel}
              chatterboxExaggeration={settings.chatterboxExaggeration}
              chatterboxCfgWeight={settings.chatterboxCfgWeight}
              chatterboxTemperature={settings.chatterboxTemperature}
              autoPlay={settings.autoPlay}
              ollamaKeepAlive={settings.ollamaKeepAlive}
              ollamaContextLength={settings.ollamaContextLength}
              deepLKey={settings.deepLKey}
              deepLFree={settings.deepLFree}
              elevenlabsKey={settings.elevenlabsKey}
              elevenlabsModel={settings.elevenlabsModel}
              elevenlabsVoiceId={settings.elevenlabsVoiceId}
              elevenlabsStability={settings.elevenlabsStability}
              elevenlabsSimilarity={settings.elevenlabsSimilarity}
              onSourceChange={(lang) => update({ sourceLang: lang })}
              onTargetChange={(lang) => update({ targetLang: lang })}
              sessionId={session?.id ?? null}
              sessionTitle={session?.title ?? null}
              messages={messages}
              onEndSession={handleEndSession}
              onMessageAppend={appendMessage}
            />
          )}
          {page === 'settings' && (
            <Settings
              ttsEnabled={settings.ttsEnabled}
              onTtsChange={(enabled) => update({ ttsEnabled: enabled })}
              ttsProvider={settings.ttsProvider}
              onTtsProviderChange={(provider) => update({ ttsProvider: provider })}
              piperVoice={settings.piperVoice}
              onPiperVoiceChange={(voice) => update({ piperVoice: voice })}
              chatterboxVoice={settings.chatterboxVoice}
              onChatterboxVoiceChange={(voice) => update({ chatterboxVoice: voice })}
              chatterboxUrl={settings.chatterboxUrl}
              onChatterboxUrlChange={(url) => update({ chatterboxUrl: url })}
              ollamaModel={settings.ollamaModel}
              onOllamaModelChange={(model) => update({ ollamaModel: model })}
              ollamaUrl={settings.ollamaUrl}
              onOllamaUrlChange={(url) => update({ ollamaUrl: url })}
              translateProvider={settings.translateProvider}
              onTranslateProviderChange={(provider) => update({ translateProvider: provider })}
              openaiUrl={settings.openaiUrl}
              onOpenaiUrlChange={(url) => update({ openaiUrl: url })}
              openaiKey={settings.openaiKey}
              onOpenaiKeyChange={(key) => update({ openaiKey: key })}
              openaiModel={settings.openaiModel}
              onOpenaiModelChange={(model) => update({ openaiModel: model })}
              chatterboxExaggeration={settings.chatterboxExaggeration}
              onChatterboxExaggerationChange={(v) => update({ chatterboxExaggeration: v })}
              chatterboxCfgWeight={settings.chatterboxCfgWeight}
              onChatterboxCfgWeightChange={(v) => update({ chatterboxCfgWeight: v })}
              chatterboxTemperature={settings.chatterboxTemperature}
              onChatterboxTemperatureChange={(v) => update({ chatterboxTemperature: v })}
              autoPlay={settings.autoPlay}
              onAutoPlayChange={(v) => update({ autoPlay: v })}
              ollamaKeepAlive={settings.ollamaKeepAlive}
              onOllamaKeepAliveChange={(v) => update({ ollamaKeepAlive: v })}
              ollamaContextLength={settings.ollamaContextLength}
              onOllamaContextLengthChange={(v) => update({ ollamaContextLength: v })}
              deepLKey={settings.deepLKey}
              onDeepLKeyChange={(v) => update({ deepLKey: v })}
              deepLFree={settings.deepLFree}
              onDeepLFreeChange={(v) => update({ deepLFree: v })}
              elevenlabsKey={settings.elevenlabsKey}
              onElevenlabsKeyChange={(v) => update({ elevenlabsKey: v })}
              elevenlabsModel={settings.elevenlabsModel}
              onElevenlabsModelChange={(v) => update({ elevenlabsModel: v })}
              elevenlabsVoiceId={settings.elevenlabsVoiceId}
              onElevenlabsVoiceIdChange={(v) => update({ elevenlabsVoiceId: v })}
              elevenlabsStability={settings.elevenlabsStability}
              onElevenlabsStabilityChange={(v) => update({ elevenlabsStability: v })}
              elevenlabsSimilarity={settings.elevenlabsSimilarity}
              onElevenlabsSimilarityChange={(v) => update({ elevenlabsSimilarity: v })}
            />
          )}
        </div>
      </Layout>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 w-72 overflow-y-auto"
            style={{ backgroundColor: 'var(--bg)', borderRight: '1px solid var(--border)' }}
          >
            {sidebar}
          </div>
        </div>
      )}
    </>
  )
}
