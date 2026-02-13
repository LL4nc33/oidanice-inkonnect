export function Footer() {
  return (
    <>
      <span>powered by ollama</span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>built by</span>
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
      <span style={{ opacity: 0.4 }}>·</span>
      <span>v{__APP_VERSION__}</span>
    </>
  )
}
