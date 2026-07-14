'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export default function NewGroupPage() {
  const [name, setName] = useState('')
  const [seed, setSeed] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const { data, error } = await supabase.rpc('create_group', {
      p_name: name.trim(),
      p_seed: seed,
    })

    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Grupa utworzona!')
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
        <h1 className="font-bold text-lg">Nowa grupa</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Stwórz grupę</CardTitle>
            <CardDescription>Nadaj jej nazwę. Możesz potem zaprosić innych kodem.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nazwa grupy</label>
                <Input
                  placeholder="np. Ekipa poniedziałkowa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div>
                  <p className="text-sm font-medium">Domyślne aktywności</p>
                  <p className="text-xs text-muted-foreground">
                    Dodaj przykładowy zestaw aktywności startowych
                  </p>
                </div>
                <Switch checked={seed} onCheckedChange={setSeed} />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
                {loading ? 'Tworzę...' : 'Stwórz grupę'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
