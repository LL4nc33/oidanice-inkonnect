import { useState, useEffect } from 'react'

const STACK = ['faster-whisper', 'piper tts', 'chatterbox', 'ollama']

export function Footer() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % STACK.length)
        setVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <span
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          display: 'inline-block',
          minWidth: '7ch',
          textAlign: 'center',
        }}
      >
        {STACK[index]}
      </span>
      <span style={{ opacity: 0.4 }}> · </span>
      <a
        href="https://github.com/LL4nc33"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline',
          border: 'none',
          padding: 0,
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
          color: 'inherit',
        }}
      >
        OidaNice
      </a>
      <span style={{ opacity: 0.4 }}> · </span>
      <span>v{__APP_VERSION__}</span>
    </span>
  )
}
