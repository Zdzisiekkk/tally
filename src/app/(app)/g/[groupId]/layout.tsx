import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/theme-toggle'
import { GroupSwitcher } from '@/components/group-switcher'
import { AccountMenu } from '@/components/account-menu'
import { TabBar } from '@/components/tab-bar'
import { buttonVariants } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Group, Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GroupLayoutProps {
  children: React.ReactNode
  params: Promise<{ groupId: string }>
}

export default async function GroupLayout({ children, params }: GroupLayoutProps) {
  const { groupId } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (!group) notFound()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (memberships ?? []).map((m) => m.group_id)
  let allGroups: Group[] = []
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false })
    allGroups = (data ?? []) as Group[]
  }

  const isAdmin = membership.role === 'admin'

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <GroupSwitcher groups={allGroups} currentGroupId={groupId} />
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              href={`/g/${groupId}/add`}
              className={cn(buttonVariants({ size: 'sm' }))}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Wpis
            </Link>
          )}
          <ThemeToggle />
          <AccountMenu
            displayName={profile?.display_name ?? 'Gracz'}
            avatarUrl={profile?.avatar_url ?? null}
            email={user.email}
          />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {children}
      </main>

      <TabBar groupId={groupId} />
    </div>
  )
}
