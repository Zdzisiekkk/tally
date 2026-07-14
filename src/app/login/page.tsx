'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  function callbackUrl() {
    const next = new URLSearchParams(window.location.search).get('next')
    const base = `${location.origin}/auth/callback`
    return next ? `${base}?next=${encodeURIComponent(next)}` : base
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4">
      {/* sunset glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-sunset-soft" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="mono-index text-xs text-muted-foreground mb-3">(01)</p>
          <h1 className="text-5xl font-extrabold tracking-tighter">Tally</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Liczcie punkty razem ze znajomymi
          </p>
        </div>

        <div className="rounded-3xl bg-card ring-1 ring-white/10 card-glow p-6 space-y-4">
          <Button
            variant="outline"
            className="w-full h-11 rounded-2xl text-sm"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Kontynuuj z Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-card px-3 text-muted-foreground">lub</span>
            </div>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full grad-accent text-white text-lg font-bold">
                ✓
              </div>
              <p className="text-sm text-muted-foreground">
                Sprawdź skrzynkę <span className="font-semibold text-foreground">{email}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Kliknij link w mailu, żeby się zalogować.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <Input
                type="email"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-2xl"
              />
              <Button type="submit" className="w-full h-11 rounded-2xl" disabled={loading}>
                {loading ? 'Wysyłam...' : 'Wyślij magic link'}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Small steps, consistent progress, big achievements.
        </p>
      </div>
    </div>
  )
}
