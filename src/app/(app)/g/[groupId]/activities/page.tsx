import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActivitiesClient } from './activities-client'
import type { Activity, Category } from '@/lib/types'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function ActivitiesPage({ params }: PageProps) {
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

  const isAdmin = membership?.role === 'admin'

  const [{ data: activities }, { data: categories }] = await Promise.all([
    supabase.from('activities').select('*').eq('group_id', groupId).order('sort_order'),
    supabase.from('categories').select('*').eq('group_id', groupId).order('sort_order'),
  ])

  return (
    <ActivitiesClient
      groupId={groupId}
      initialActivities={(activities ?? []) as Activity[]}
      categories={(categories ?? []) as Category[]}
      isAdmin={isAdmin}
    />
  )
}
