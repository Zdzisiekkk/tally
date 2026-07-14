import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntryComposer } from '@/components/entry-composer'
import type { Activity, Profile, GroupMember } from '@/lib/types'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function AddEntryPage({ params }: PageProps) {
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

  if (membership?.role !== 'admin') {
    redirect(`/g/${groupId}`)
  }

  const [{ data: activities }, { data: memberRows }] = await Promise.all([
    supabase.from('activities').select('*').eq('group_id', groupId).eq('is_active', true).order('sort_order'),
    supabase.from('group_members').select('user_id').eq('group_id', groupId),
  ])

  const memberUserIds = (memberRows ?? []).map((m) => m.user_id)
  let members: Profile[] = []
  if (memberUserIds.length > 0) {
    const { data } = await supabase.from('profiles').select('*').in('id', memberUserIds)
    members = (data ?? []) as Profile[]
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Nowy wpis</h2>
      <Card>
        <CardContent className="py-4">
          <EntryComposer
            groupId={groupId}
            activities={(activities ?? []) as Activity[]}
            members={members}
          />
        </CardContent>
      </Card>
    </div>
  )
}
