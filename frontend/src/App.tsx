import { useState } from 'react'
import { Layout, DarkModeToggle, InstallPrompt, Button } from '@oidanice/ink-ui'
import { useSettings } from './hooks/useSettings'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'

type Page = 'home' | 'settings'

export function App() {
  const [page, setPage] = useState<Page>('home')
  const { settings, update } = useSettings()

  return (
    <Layout
      title="inkonnect"
      headerRight={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() => setPage(page === 'home' ? 'settings' : 'home')}
          >
            {page === 'home' ? '[ settings ]' : '[ back ]'}
          </Button>
          <DarkModeToggle />
        </div>
      }
      banner={<InstallPrompt />}
      footer={<span>inkonnect · oidanice</span>}
    >
      {page === 'home' ? (
        <Home
          sourceLang={settings.sourceLang}
          targetLang={settings.targetLang}
          ttsEnabled={settings.ttsEnabled}
          onSourceChange={(lang) => update({ sourceLang: lang })}
          onTargetChange={(lang) => update({ targetLang: lang })}
        />
      ) : (
        <Settings
          ttsEnabled={settings.ttsEnabled}
          onTtsChange={(enabled) => update({ ttsEnabled: enabled })}
        />
      )}
    </Layout>
  )
}
