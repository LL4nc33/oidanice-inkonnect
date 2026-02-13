import { useState, useEffect, useRef } from 'react'
import { Input, Button, Divider } from '@oidanice/ink-ui'
import { getChatterboxVoices, uploadChatterboxVoice, deleteChatterboxVoice, ChatterboxVoice } from '../api/inkonnect'
import { SearchSelect } from './SearchSelect'

interface ChatterboxVoiceManagerProps {
  selectedVoice: string
  onVoiceChange: (voice: string) => void
}

export function ChatterboxVoiceManager({ selectedVoice, onVoiceChange }: ChatterboxVoiceManagerProps) {
  const [voices, setVoices] = useState<ChatterboxVoice[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [uploadVoiceName, setUploadVoiceName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadVoices = () => {
    setLoadingVoices(true)
    getChatterboxVoices()
      .then(setVoices)
      .catch(() => setVoices([]))
      .finally(() => setLoadingVoices(false))
  }

  useEffect(() => {
    loadVoices()
  }, [])

  const voiceNames = voices.map((v) => v.name)

  const handleUpload = async () => {
    if (!uploadFile || !uploadVoiceName.trim()) return
    setUploading(true)
    setUploadStatus(null)
    try {
      const res = await uploadChatterboxVoice(uploadFile, uploadVoiceName.trim())
      setUploadStatus(res.message)
      if (res.success) {
        setUploadVoiceName('')
        setUploadFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        loadVoices()
      }
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedVoice) return
    setDeleting(true)
    setUploadStatus(null)
    try {
      const res = await deleteChatterboxVoice(selectedVoice)
      setUploadStatus(res.message)
      if (res.success) {
        onVoiceChange('')
        loadVoices()
      }
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <SearchSelect
        label={loadingVoices ? 'Voice (loading...)' : 'Voice'}
        value={selectedVoice}
        options={voiceNames}
        placeholder="Select voice..."
        onChange={onVoiceChange}
      />

      {selectedVoice && (
        <Button onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : `Delete "${selectedVoice}"`}
        </Button>
      )}

      <Divider spacing="sm" />

      <div className="space-y-2">
        <Input
          label="Voice Name"
          placeholder="e.g. my-voice"
          value={uploadVoiceName}
          onChange={(e) => setUploadVoiceName(e.target.value)}
        />
        <label className="block font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          Audio File
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="block mt-1 font-mono text-xs w-full"
            style={{ color: 'var(--text)' }}
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <Button
          onClick={handleUpload}
          disabled={uploading || !uploadVoiceName.trim() || !uploadFile}
        >
          {uploading ? 'Uploading...' : 'Upload Voice'}
        </Button>
        {uploadStatus && (
          <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
            {uploadStatus}
          </p>
        )}
      </div>
    </div>
  )
}
