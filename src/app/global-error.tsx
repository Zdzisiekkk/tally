'use client'

import { useEffect } from 'react'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Deployment-skew self-heal (see error.tsx for rationale).
    const KEY = 'tally-global-error-reloaded'
    if (sessionStorage.getItem(KEY) !== '1') {
      sessionStorage.setItem(KEY, '1')
      window.location.reload()
      return
    }
    const t = setTimeout(() => sessionStorage.removeItem(KEY), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <html lang="pl">
      <body style={{ background: '#0A0A0A', color: '#F3F1EC', fontFamily: 'monospace' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            textAlign: 'center',
            padding: 24,
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Coś poszło nie tak</h1>
          <p style={{ fontSize: 14, opacity: 0.7 }}>Odśwież stronę, aby spróbować ponownie.</p>
          <button
            onClick={() => reset()}
            style={{
              background: '#FF3B23',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 18px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Odśwież
          </button>
        </div>
      </body>
    </html>
  )
}
