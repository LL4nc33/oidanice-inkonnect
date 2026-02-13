import { useState, useEffect, useRef } from 'react'
import { Input, Select, Button, Divider } from '@oidanice/ink-ui'
import { getChatterboxVoices, uploadChatterboxVoice, deleteChatterboxVoice, getChatterboxLanguages, ChatterboxVoice } from '../api/inkonnect'
import { SearchSelect } from './SearchSelect'
import { VoiceRecorder } from './VoiceRecorder'

interface ChatterboxVoiceManagerProps {
  selectedVoice: string
  onVoiceChange: (voice: string) => void
  exaggeration: number
  onExaggerationChange: (v: number) => void
  cfgWeight: number
  onCfgWeightChange: (v: number) => void
  temperature: number
  onTemperatureChange: (v: number) => void
}

function RangeSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex items-center gap-2 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
      <span className="w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="flex-1"
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="w-10 text-right">{value.toFixed(2)}</span>
    </label>
  )
}

export function ChatterboxVoiceManager({
  selectedVoice, onVoiceChange,
  exaggeration, onExaggerationChange,
  cfgWeight, onCfgWeightChange,
  temperature, onTemperatureChange,
}: ChatterboxVoiceManagerProps) {
  const [voices, setVoices] = useState<ChatterboxVoice[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)
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

  const loadVoices = () => {
    setLoadingVoices(true)
    getChatterboxVoices()
      .then(setVoices)
      .catch(() => setVoices([]))
      .finally(() => setLoadingVoices(false))
  }

  useEffect(() => {
    loadVoices()
    getChatterboxLanguages()
      .then(setLanguages)
      .catch(() => setLanguages([]))
  }, [])

  const voiceNames = voices.map((v) => v.name)

  const handleDelete = async () => {
    if (!selectedVoice) return
    setDeleting(true)
    setUploadStatus(null)
    try {
      const res = await deleteChatterboxVoice(selectedVoice)
      setUploadStatus(res.message)
      if (res.success) { onVoiceChange(''); loadVoices() }
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
      const res = await uploadChatterboxVoice(recordedBlob, recordName.trim(), recordLang || undefined)
      setUploadStatus(res.message)
      if (res.success) { setRecordedBlob(null); setRecordName(''); setRecordLang(''); loadVoices() }
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
      const res = await uploadChatterboxVoice(uploadFile, uploadName.trim(), uploadLang || undefined)
      setUploadStatus(res.message)
      if (res.success) {
        setUploadName(''); setUploadFile(null); setUploadLang('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        loadVoices()
      }
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setFileUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Voice Library */}
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
      <div className="space-y-2 mt-2">
        <RangeSlider label="exaggeration" value={exaggeration} min={0.25} max={2.0} step={0.05} onChange={onExaggerationChange} />
        <RangeSlider label="cfg_weight" value={cfgWeight} min={0.0} max={1.0} step={0.05} onChange={onCfgWeightChange} />
        <RangeSlider label="temperature" value={temperature} min={0.05} max={5.0} step={0.05} onChange={onTemperatureChange} />
      </div>

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
