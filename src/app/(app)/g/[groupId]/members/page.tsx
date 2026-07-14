import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InviteCodeCopy } from './invite-code-copy'
import { InviteLinkShare } from './invite-link-share'
import type { GroupMember, Profile } from '@/lib/types'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function MembersPage({ params }: PageProps) {
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

  const { data: group } = await supabase.from('groups').select('name, invite_code').eq('id', groupId).single()

  const { data: members } = await supabase
    .from('group_members')
    .select('*, profiles(*)')
    .eq('group_id', groupId)
    .order('joined_at')

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Członkowie</h2>

      {isAdmin && group && (
        <Card>
          <CardContent className="py-4 space-y-4">
            <div>
              <p className="text-xs font-semibold mb-2">Zaproś przez link</p>
              <InviteLinkShare code={group.invite_code} groupName={group.name} />
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground mb-1">lub podaj sam kod</p>
              <InviteCodeCopy code={group.invite_code} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(members ?? []).map((m: GroupMember & { profiles: Profile }) => (
          <Card key={m.id}>
            <CardContent className="py-3 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.profiles?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {(m.profiles?.display_name ?? 'G').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {m.profiles?.display_name ?? 'Gracz'}
                  {m.user_id === user.id && (
                    <span className="ml-1 text-xs text-muted-foreground">(ty)</span>
                  )}
                </p>
              </div>
              {m.role === 'admin' && (
                <Badge variant="secondary" className="text-[10px]">Admin</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
