import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeaderboardList } from '@/components/leaderboard-list'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { subDays, startOfWeek, startOfMonth } from 'date-fns'
import { computeRankMomentum } from '@/lib/stats'
import type { LeaderboardRow, EntryFeedRow } from '@/lib/types'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function LeaderboardPage({ params }: PageProps) {
  const { groupId } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  async function getLeaderboard(since?: Date): Promise<LeaderboardRow[]> {
    const args: { p_group: string; p_since?: string } = { p_group: groupId }
    if (since) args.p_since = since.toISOString()
    const { data } = await supabase.rpc('leaderboard', args)
    return (data ?? []) as LeaderboardRow[]
  }

  const now = new Date()
  const [allTime, thisWeek, thisMonth, last7, last30, { data: feedData }] = await Promise.all([
    getLeaderboard(),
    getLeaderboard(startOfWeek(now, { weekStartsOn: 1 })),
    getLeaderboard(startOfMonth(now)),
    getLeaderboard(subDays(now, 7)),
    getLeaderboard(subDays(now, 30)),
    supabase
      .from('entry_feed')
      .select('*')
      .eq('group_id', groupId)
      .gte('occurred_at', subDays(now, 14).toISOString()),
  ])

  const recentFeed = (feedData ?? []) as EntryFeedRow[]
  const momentum = Object.fromEntries(computeRankMomentum(recentFeed))

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="mono-index text-[11px] text-muted-foreground">(01)</p>
          <h2 className="text-2xl font-extrabold tracking-tighter">Ranking</h2>
        </div>
        <p className="text-[11px] text-muted-foreground pb-1">Wspinaj się na szczyt</p>
      </div>

      <Tabs defaultValue="alltime">
        <TabsList className="w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="alltime" className="flex-1 text-xs">All-time</TabsTrigger>
          <TabsTrigger value="week" className="flex-1 text-xs">Ten tyg.</TabsTrigger>
          <TabsTrigger value="month" className="flex-1 text-xs">Ten mies.</TabsTrigger>
          <TabsTrigger value="7d" className="flex-1 text-xs">7 dni</TabsTrigger>
          <TabsTrigger value="30d" className="flex-1 text-xs">30 dni</TabsTrigger>
        </TabsList>
        <TabsContent value="alltime">
          <LeaderboardList rows={allTime} currentUserId={user.id} momentum={momentum} />
        </TabsContent>
        <TabsContent value="week">
          <LeaderboardList rows={thisWeek} currentUserId={user.id} momentum={momentum} />
        </TabsContent>
        <TabsContent value="month">
          <LeaderboardList rows={thisMonth} currentUserId={user.id} momentum={momentum} />
        </TabsContent>
        <TabsContent value="7d">
          <LeaderboardList rows={last7} currentUserId={user.id} momentum={momentum} />
        </TabsContent>
        <TabsContent value="30d">
          <LeaderboardList rows={last30} currentUserId={user.id} momentum={momentum} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
