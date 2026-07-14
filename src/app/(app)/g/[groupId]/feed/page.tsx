import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedClient } from './feed-client'
import type { EntryFeedRow } from '@/lib/types'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function FeedPage({ params }: PageProps) {
  const { groupId } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('entry_feed')
    .select('*')
    .eq('group_id', groupId)
    .order('occurred_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Feed</h2>
      <FeedClient groupId={groupId} initialData={(data ?? []) as EntryFeedRow[]} />
    </div>
  )
}
