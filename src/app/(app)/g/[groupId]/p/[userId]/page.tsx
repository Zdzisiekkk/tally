import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntryCard } from '@/components/entry-card'
import { BadgeGrid } from '@/components/badge-grid'
import { ActivityBarChart } from '@/components/charts/activity-bar-chart'
import { CalendarHeatmap } from '@/components/charts/calendar-heatmap'
import { StatHighlights } from '@/components/stat-highlights'
import {
  computeBadges,
  computeStreak,
  computeCalendar,
  computeRecords,
  computeForm,
  percentile,
} from '@/lib/stats'
import { formatPoints } from '@/lib/points'
import { subDays } from 'date-fns'
import type { EntryFeedRow, LeaderboardRow, StatsActivityRow, Profile } from '@/lib/types'

interface PageProps {
  params: Promise<{ groupId: string; userId: string }>
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { groupId, userId } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  // Check group membership for viewer
  const { data: myMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!myMembership) notFound()

  // Check subject membership
  const { data: subjectMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  if (!subjectMembership) notFound()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (!profile) notFound()

  const [
    { data: allTimeRows },
    { data: weekRows },
    { data: monthRows },
    { data: feedData },
    { data: actStats },
  ] = await Promise.all([
    supabase.rpc('leaderboard', { p_group: groupId }),
    supabase.rpc('leaderboard', { p_group: groupId, p_since: subDays(new Date(), 7).toISOString() }),
    supabase.rpc('leaderboard', { p_group: groupId, p_since: subDays(new Date(), 30).toISOString() }),
    supabase.from('entry_feed').select('*').eq('group_id', groupId).eq('subject_id', userId).order('occurred_at', { ascending: false }).limit(100),
    supabase.rpc('stats_by_activity', { p_group: groupId, p_user: userId }),
  ])

  const allTimeLb = (allTimeRows ?? []) as LeaderboardRow[]
  const weekLb = (weekRows ?? []) as LeaderboardRow[]
  const monthLb = (monthRows ?? []) as LeaderboardRow[]
  const feed = (feedData ?? []) as EntryFeedRow[]
  const actStatsData = (actStats ?? []) as StatsActivityRow[]

  const myAllTime = allTimeLb.find((r) => r.user_id === userId)
  const myWeek = weekLb.find((r) => r.user_id === userId)
  const myMonth = monthLb.find((r) => r.user_id === userId)
  const myRank = allTimeLb.findIndex((r) => r.user_id === userId) + 1

  const allTimeTotal = Number(myAllTime?.total ?? 0)
  const entryCount = Number(myAllTime?.entries_count ?? 0)
  const avgPerEntry = entryCount > 0 ? allTimeTotal / entryCount : 0
  const biggestEntry = feed.reduce((max, e) => Math.max(max, Number(e.total_points)), 0)
  const streak = computeStreak(feed, userId)
  const badges = computeBadges(allTimeTotal, feed, userId)
  const calendar = computeCalendar(feed, { userId })
  const records = computeRecords(feed, userId)
  const form = computeForm(feed, userId)
  const pct = percentile(allTimeLb, userId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={(profile as Profile).avatar_url ?? undefined} />
          <AvatarFallback className="text-xl font-bold">
            {(profile as Profile).display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{(profile as Profile).display_name}</h2>
          <p className="text-sm text-muted-foreground">
            #{myRank} w rankingu · streak {streak} {streak === 1 ? 'dzień' : 'dni'}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'All-time', value: formatPoints(allTimeTotal) + ' pkt' },
          { label: 'Ten tydzień', value: formatPoints(Number(myWeek?.total ?? 0)) + ' pkt' },
          { label: 'Ten miesiąc', value: formatPoints(Number(myMonth?.total ?? 0)) + ' pkt' },
          { label: 'Wpisów', value: entryCount },
          { label: 'Śr./wpis', value: formatPoints(avgPerEntry) + ' pkt' },
          { label: 'Rekord wpisu', value: formatPoints(biggestEntry) + ' pkt' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-3 text-center">
              <p className="text-xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records & form */}
      <Card>
        <CardHeader><CardTitle className="text-base">Rekordy i forma</CardTitle></CardHeader>
        <CardContent>
          <StatHighlights records={records} form={form} percentileValue={pct} />
        </CardContent>
      </Card>

      {/* Activity heatmap */}
      <Card>
        <CardHeader><CardTitle className="text-base">Aktywność w czasie</CardTitle></CardHeader>
        <CardContent>
          <CalendarHeatmap cells={calendar} />
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader><CardTitle className="text-base">Odznaki</CardTitle></CardHeader>
        <CardContent>
          <BadgeGrid badges={badges} />
        </CardContent>
      </Card>

      {/* Top activities */}
      {actStatsData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Top aktywności</CardTitle></CardHeader>
          <CardContent>
            <ActivityBarChart data={actStatsData} />
          </CardContent>
        </Card>
      )}

      {/* Entry history */}
      <div>
        <h3 className="font-semibold text-base mb-3">Historia wpisów</h3>
        {feed.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Brak wpisów</div>
        ) : (
          <div className="space-y-3">
            {feed.slice(0, 20).map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
