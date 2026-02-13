import { useState, useEffect } from 'react'
import { Input, Button, Divider } from '@oidanice/ink-ui'
import { getPiperVoices, downloadPiperVoice } from '../../api/inkonnect'
import { SearchSelect } from '../SearchSelect'

interface PiperConfigProps {
  piperVoice: string
  onPiperVoiceChange: (voice: string) => void
}

export function PiperConfig({ piperVoice, onPiperVoiceChange }: PiperConfigProps) {
  const [voices, setVoices] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [newVoiceName, setNewVoiceName] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getPiperVoices()
      .then(setVoices)
      .catch(() => setVoices([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async () => {
    const name = newVoiceName.trim()
    if (!name) return
    setDownloading(true)
    setDownloadStatus(null)
    try {
      const res = await downloadPiperVoice(name)
      setDownloadStatus(res.message)
      if (res.success) {
        setNewVoiceName('')
        setLoading(true)
        getPiperVoices().then(setVoices).catch(() => {}).finally(() => setLoading(false))
      }
    } catch (err) {
      setDownloadStatus(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <SearchSelect
        label={loading ? 'Voice (loading...)' : 'Voice'}
        value={piperVoice}
        options={voices}
        placeholder="Backend default"
        onChange={onPiperVoiceChange}
      />
      <Divider spacing="sm" />
      <div className="space-y-2">
        <Input
          label="Download Voice"
          placeholder="e.g. en_US-lessac-high"
          value={newVoiceName}
          onChange={(e) => setNewVoiceName(e.target.value)}
        />
        <Button onClick={handleDownload} disabled={downloading || !newVoiceName.trim()}>
          {downloading ? 'Downloading...' : 'Download'}
        </Button>
        {downloadStatus && (
          <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
            {downloadStatus}
          </p>
        )}
      </div>
    </>
  )
}
