'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export function InviteLinkShare({ code, groupName }: { code: string; groupName: string }) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])

  const link = origin ? `${origin}/join/${code}` : ''

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Skopiowano link')
    setTimeout(() => setCopied(false), 2000)
  }

  async function share() {
    try {
      await navigator.share({
        title: `Dołącz do grupy ${groupName}`,
        text: `Dołącz do mojej grupy "${groupName}" w Tally:`,
        url: link,
      })
    } catch {
      /* user cancelled share sheet */
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate text-xs bg-muted px-3 py-2 rounded-xl text-muted-foreground">
          {link || 'Generowanie linku...'}
        </code>
        <Button variant="outline" size="icon" onClick={copy} disabled={!link} aria-label="Kopiuj link">
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      {canShare ? (
        <Button onClick={share} disabled={!link} className="w-full h-10 rounded-xl">
          <Share2 className="mr-2 h-4 w-4" />
          Wyślij zaproszenie
        </Button>
      ) : (
        <Button onClick={copy} disabled={!link} variant="secondary" className="w-full h-10 rounded-xl">
          <Copy className="mr-2 h-4 w-4" />
          Kopiuj link zaproszenia
        </Button>
      )}
    </div>
  )
}
