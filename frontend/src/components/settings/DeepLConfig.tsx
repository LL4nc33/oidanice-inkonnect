import { Input, Select } from '@oidanice/ink-ui'

interface DeepLConfigProps {
  deepLKey: string
  onDeepLKeyChange: (key: string) => void
  deepLFree: boolean
  onDeepLFreeChange: (free: boolean) => void
}

export function DeepLConfig({
  deepLKey, onDeepLKeyChange,
  deepLFree, onDeepLFreeChange,
}: DeepLConfigProps) {
  return (
    <>
      <Input
        label="API Key"
        type="password"
        placeholder="DeepL API Key"
        value={deepLKey}
        onChange={(e) => onDeepLKeyChange(e.target.value)}
      />
      <Select
        label="Tier"
        value={deepLFree ? 'free' : 'pro'}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onDeepLFreeChange(e.target.value === 'free')}
      >
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </Select>
    </>
  )
}
