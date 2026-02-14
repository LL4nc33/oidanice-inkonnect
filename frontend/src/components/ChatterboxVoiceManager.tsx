import { useState, useEffect, useRef } from 'react'
import { Input, Select, Button, Divider } from '@oidanice/ink-ui'
import { uploadChatterboxVoice, deleteChatterboxVoice, getChatterboxLanguages } from '../api/dolmtschr'
import { VoiceRecorder } from './VoiceRecorder'

interface ChatterboxVoiceManagerProps {
  selectedVoice: string
  onVoiceChange: (voice: string) => void
  onVoicesChanged: () => void
  chatterboxUrl: string
}

export function ChatterboxVoiceManager({
  selectedVoice, onVoiceChange, onVoicesChanged, chatterboxUrl,
}: ChatterboxVoiceManagerProps) {
  const [languages, setLanguages] = useState<string[]>([])
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Record Voice state
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordName, setRecordName] = useState('')
  const [recordLang, setRecordLang] = useState('')
  const [recordUploading, setRecordUploading] = useState(false)

  // Upload File state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadLang, setUploadLang] = useState('')
  const [fileUploading, setFileUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getChatterboxLanguages(chatterboxUrl || undefined)
      .then(setLanguages)
      .catch(() => setLanguages([]))
  }, [chatterboxUrl])

  const handleDelete = async () => {
    if (!selectedVoice) return
    setDeleting(true)
    setUploadStatus(null)
    try {
      const res = await deleteChatterboxVoice(selectedVoice, chatterboxUrl || undefined)
      setUploadStatus(res.message)
      if (res.success) { onVoiceChange(''); onVoicesChanged() }
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleRecordUpload = async () => {
    if (!recordedBlob || !recordName.trim()) return
    setRecordUploading(true)
    setUploadStatus(null)
    try {
      const res = await uploadChatterboxVoice(recordedBlob, recordName.trim(), recordLang || undefined, chatterboxUrl || undefined)
      setUploadStatus(res.message)
      if (res.success) { setRecordedBlob(null); setRecordName(''); setRecordLang(''); onVoicesChanged() }
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setRecordUploading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return
    setFileUploading(true)
    setUploadStatus(null)
    try {
      const res = await uploadChatterboxVoice(uploadFile, uploadName.trim(), uploadLang || undefined, chatterboxUrl || undefined)
      setUploadStatus(res.message)
      if (res.success) {
        setUploadName(''); setUploadFile(null); setUploadLang('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        onVoicesChanged()
      }
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setFileUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Delete selected voice */}
      {selectedVoice && (
        <Button onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : `Delete "${selectedVoice}"`}
        </Button>
      )}

      <Divider spacing="sm" />

      {/* Record Voice */}
      <div className="space-y-2">
        <VoiceRecorder onRecorded={setRecordedBlob} />
        <Input label="Voice Name" placeholder="e.g. my-voice" value={recordName} onChange={(e) => setRecordName(e.target.value)} />
        <Select label="Language" value={recordLang} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRecordLang(e.target.value)}>
          <option value="">-- none --</option>
          {languages.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
        <Button onClick={handleRecordUpload} disabled={recordUploading || !recordedBlob || !recordName.trim()}>
          {recordUploading ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <Divider spacing="sm" />

      {/* Upload File */}
      <div className="space-y-2">
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
        <Input label="Voice Name" placeholder="e.g. my-voice" value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
        <Select label="Language" value={uploadLang} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUploadLang(e.target.value)}>
          <option value="">-- none --</option>
          {languages.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
        <Button onClick={handleFileUpload} disabled={fileUploading || !uploadName.trim() || !uploadFile}>
          {fileUploading ? 'Uploading...' : 'Upload Voice'}
        </Button>
      </div>

      {uploadStatus && (
        <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{uploadStatus}</p>
      )}
    </div>
  )
}
