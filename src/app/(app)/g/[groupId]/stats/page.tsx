import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimelineChart } from '@/components/charts/timeline-chart'
import { ActivityBarChart } from '@/components/charts/activity-bar-chart'
import type { StatsActivityRow, StatsTimelineRow, LeaderboardRow } from '@/lib/types'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function StatsPage({ params }: PageProps) {
  const { groupId } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const [{ data: timelineWeek }, { data: timelineMonth }, { data: activities }, { data: lb }] = await Promise.all([
    supabase.rpc('stats_timeline', { p_group: groupId, p_bucket: 'week' }),
    supabase.rpc('stats_timeline', { p_group: groupId, p_bucket: 'day' }),
    supabase.rpc('stats_by_activity', { p_group: groupId }),
    supabase.rpc('leaderboard', { p_group: groupId }),
  ])

  const leaderboard = (lb ?? []) as LeaderboardRow[]
  const totalPts = leaderboard.reduce((s, r) => s + Number(r.total), 0)
  const totalEntries = leaderboard.reduce((s, r) => s + Number(r.entries_count), 0)
  const avgPerEntry = totalEntries > 0 ? (totalPts / totalEntries).toFixed(1) : '0'

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

      {/* Activity breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top aktywności</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityBarChart data={(activities ?? []) as StatsActivityRow[]} />
        </CardContent>
      </Card>
    </div>
  )
}
