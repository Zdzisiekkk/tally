'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SettingsFormProps {
  initialName: string
  initialAvatar: string
  email: string
}

export function SettingsForm({ initialName, initialAvatar, email }: SettingsFormProps) {
  const [name, setName] = useState(initialName)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const dirty = name.trim() !== initialName || avatar.trim() !== initialAvatar

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nick nie może być pusty')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name.trim(), avatar_url: avatar.trim() || null })
      .eq('id', user.id)

    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Zapisano profil')
      router.refresh()
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    toast.success('Wylogowano')
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Twój nick i awatar widoczne dla innych w grupach.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-1 ring-white/10">
                <AvatarImage src={avatar.trim() || undefined} />
                <AvatarFallback className="text-lg font-bold">
                  {(name || 'G').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">{name || 'Bez nicku'}</p>
                <p className="text-xs">{email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nick</label>
              <Input
                placeholder="np. Kuba"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Link do awatara (opcjonalnie)</label>
              <Input
                placeholder="https://..."
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                type="url"
              />
              <p className="text-[11px] text-muted-foreground">
                Wklej URL do zdjęcia. Zostaw puste, aby użyć inicjałów.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !dirty}>
              {loading ? 'Zapisuję...' : 'Zapisz zmiany'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <Button variant="destructive" className="w-full" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Wyloguj się
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
