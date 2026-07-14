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
    // Deployment skew / stale chunk — force a hard reload once
    if (/ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(error.message)) {
      window.location.reload()
    }
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
