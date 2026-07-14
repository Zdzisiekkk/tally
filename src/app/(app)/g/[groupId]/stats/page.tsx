import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimelineChart } from '@/components/charts/timeline-chart'
import { ActivityBarChart } from '@/components/charts/activity-bar-chart'
import { CalendarHeatmap } from '@/components/charts/calendar-heatmap'
import { CategoryBreakdown } from '@/components/charts/category-breakdown'
import { HeadToHead } from '@/components/head-to-head'
import { SeasonTrophies } from '@/components/season-trophies'
import { StatHighlights } from '@/components/stat-highlights'
import {
  computeCalendar,
  computeCategoryBreakdown,
  computeMVP,
  computeRecords,
  computeSeasonWinners,
} from '@/lib/stats'
import type { StatsActivityRow, StatsTimelineRow, LeaderboardRow, EntryFeedRow } from '@/lib/types'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function StatsPage({ params }: PageProps) {
  const { groupId } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const [
    { data: timelineWeek },
    { data: timelineMonth },
    { data: activities },
    { data: lb },
    { data: feedData },
  ] = await Promise.all([
    supabase.rpc('stats_timeline', { p_group: groupId, p_bucket: 'week' }),
    supabase.rpc('stats_timeline', { p_group: groupId, p_bucket: 'day' }),
    supabase.rpc('stats_by_activity', { p_group: groupId }),
    supabase.rpc('leaderboard', { p_group: groupId }),
    supabase
      .from('entry_feed')
      .select('*')
      .eq('group_id', groupId)
      .order('occurred_at', { ascending: false })
      .limit(1000),
  ])

  const leaderboard = (lb ?? []) as LeaderboardRow[]
  const feed = (feedData ?? []) as EntryFeedRow[]

  const totalPts = leaderboard.reduce((s, r) => s + Number(r.total), 0)
  const totalEntries = leaderboard.reduce((s, r) => s + Number(r.entries_count), 0)
  const avgPerEntry = totalEntries > 0 ? (totalPts / totalEntries).toFixed(1) : '0'

  const calendar = computeCalendar(feed)
  const records = computeRecords(feed)
  const mvp = computeMVP(feed)
  const categories = computeCategoryBreakdown(feed)
  const seasons = computeSeasonWinners(feed)
  const members = leaderboard.map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name,
    avatar_url: r.avatar_url,
  }))

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Statystyki</h2>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pkt łącznie', value: totalPts.toFixed(0) },
          { label: 'Wpisów', value: totalEntries },
          { label: 'Śr./wpis', value: avgPerEntry },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Highlights: MVP + group records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rekordy grupy</CardTitle>
        </CardHeader>
        <CardContent>
          <StatHighlights records={records} mvp={mvp} />
        </CardContent>
      </Card>

      {/* Calendar heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktywność w czasie</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarHeatmap cells={calendar} />
        </CardContent>
      </Card>

      {/* Timeline per week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Punkty / tydzień</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineChart data={(timelineWeek ?? []) as StatsTimelineRow[]} />
        </CardContent>
      </Card>

      {/* Daily timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktywność dzienna</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineChart data={(timelineMonth ?? []) as StatsTimelineRow[]} />
        </CardContent>
      </Card>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Podział punktów</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown data={categories} />
          </CardContent>
        </Card>
      )}

      {/* Activity breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top aktywności</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityBarChart data={(activities ?? []) as StatsActivityRow[]} />
        </CardContent>
      </Card>

      {/* Head to head */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pojedynek 1v1</CardTitle>
        </CardHeader>
        <CardContent>
          <HeadToHead members={members} entries={feed} />
        </CardContent>
      </Card>

      {/* Season trophies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sezony — gablota trofeów</CardTitle>
        </CardHeader>
        <CardContent>
          <SeasonTrophies winners={seasons} />
        </CardContent>
      </Card>
    </div>
  )
}
