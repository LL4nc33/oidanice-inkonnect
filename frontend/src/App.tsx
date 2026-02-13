import { useState } from 'react'
import { Layout, DarkModeToggle, InstallPrompt, Button } from '@oidanice/ink-ui'
import { useSettings } from './hooks/useSettings'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'
import { Footer } from './components/Footer'

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
      footer={<Footer />}
    >
      {page === 'home' ? (
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
        />
      ) : (
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
    </Layout>
  )
}
