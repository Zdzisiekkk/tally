import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function JoinByLinkPage({ params }: PageProps) {
  const { code } = await params
  const cleanCode = decodeURIComponent(code).trim().toLowerCase()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  // Not logged in — send to login, come back to this exact link after auth
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/join/${cleanCode}`)}`)
  }

  const { data, error } = await supabase.rpc('join_group_by_code', { p_code: cleanCode })

  if (error || !data) {
    redirect('/join?error=invalid')
  }

  redirect(`/g/${data}`)
}
