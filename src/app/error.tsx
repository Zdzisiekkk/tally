'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Deployment-skew self-heal. In production the real error message is masked
    // (only a digest reaches the client), so matching on the message misses most
    // stale-chunk errors after a new deploy. Force a single hard reload — guarded
    // by sessionStorage so a genuinely broken page can't loop — to pull the fresh
    // chunks. If the error persists past the reload, the UI below is shown.
    const KEY = 'tally-error-reloaded'
    if (sessionStorage.getItem(KEY) !== '1') {
      sessionStorage.setItem(KEY, '1')
      window.location.reload()
      return
    }
    // Clear the guard after a clean render so future skews can self-heal too.
    const t = setTimeout(() => sessionStorage.removeItem(KEY), 5000)
    return () => clearTimeout(t)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full grad-accent text-white">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold">Coś poszło nie tak</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          Odśwież stronę lub spróbuj ponownie. Jeśli problem wraca, daj znać.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Spróbuj ponownie</Button>
        <Button variant="outline" onClick={() => window.location.assign('/')}>
          Strona główna
        </Button>
      </div>
    </div>
  )
}
