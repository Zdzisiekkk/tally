'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function JoinGroupPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'invalid') {
      toast.error('Link zaproszenia jest nieprawidłowy lub wygasł')
    }
  }, [])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)

    const { data, error } = await supabase.rpc('join_group_by_code', {
      p_code: code.trim().toLowerCase(),
    })

    setLoading(false)
    if (error) {
      toast.error(error.message === 'INVALID_CODE' ? 'Nieprawidłowy kod' : error.message)
    } else {
      toast.success('Dołączyłeś do grupy!')
      router.push(`/g/${data}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-lg">Dołącz do grupy</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Kod zaproszenia</CardTitle>
            <CardDescription>Wklej 12-znakowy kod który dostałeś od admina grupy.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                placeholder="np. a3f8b2c1d4e5"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-center tracking-widest text-lg"
                required
              />
              <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
                {loading ? 'Dołączam...' : 'Dołącz'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
