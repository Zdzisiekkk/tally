import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/theme-toggle'
import { AccountMenu } from '@/components/account-menu'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Plus, Hash } from 'lucide-react'
import type { Group, Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', user.id)

  const groupIds = (memberships ?? []).map((m) => m.group_id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  let groups: Group[] = []
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false })
    groups = (data ?? []) as Group[]
  }

  if (groups.length === 1) {
    redirect(`/g/${groups[0].id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Tally</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AccountMenu
            displayName={profile?.display_name ?? 'Gracz'}
            avatarUrl={profile?.avatar_url ?? null}
            email={user.email}
          />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Twoje grupy</h2>
          <div className="flex gap-2">
            <Link href="/join" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              <Hash className="mr-1.5 h-3.5 w-3.5" />
              Dołącz
            </Link>
            <Link href="/new-group" className={cn(buttonVariants({ size: 'sm' }))}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nowa
            </Link>
          </div>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-semibold text-lg">Brak grup</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Stwórz nową grupę lub dołącz do istniejącej kodem.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Link href="/join" className={cn(buttonVariants({ variant: 'outline' }))}>Dołącz kodem</Link>
                <Link href="/new-group" className={cn(buttonVariants())}>Stwórz grupę</Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const myRole = memberships?.find((m) => m.group_id === group.id)?.role
              return (
                <Link key={group.id} href={`/g/${group.id}`}>
                  <Card className="hover:scale-[1.01] transition-all cursor-pointer">
                    <CardContent className="py-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Hash className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{group.name}</p>
                        {group.description && (
                          <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                        )}
                      </div>
                      {myRole === 'admin' && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          Admin
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
