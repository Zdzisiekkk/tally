'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { StatsTimelineRow } from '@/lib/types'

interface TimelineChartProps {
  data: StatsTimelineRow[]
}

const COLORS = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#BF5AF2', '#64D2FF']

export function TimelineChart({ data }: TimelineChartProps) {
  // Pivot: bucket -> { user_id: points }
  const usersSet = new Set(data.map((r) => r.user_id))
  const users = Array.from(usersSet)
  const bucketsSet = new Set(data.map((r) => r.bucket))
  const buckets = Array.from(bucketsSet).sort()

  const userNames: Record<string, string> = {}
  data.forEach((r) => { userNames[r.user_id] = r.display_name })

  const chartData = buckets.map((bucket) => {
    const row: Record<string, unknown> = {
      bucket,
      label: format(new Date(bucket), 'd MMM', { locale: pl }),
    }
    for (const userId of users) {
      const found = data.find((r) => r.bucket === bucket && r.user_id === userId)
      row[userId] = found ? Number(found.points) : 0
    }
    return row
  })

  if (chartData.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Brak danych</div>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: '12px' }}
          formatter={(val) => [`${val} pkt`]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {users.map((userId, i) => (
          <Line
            key={userId}
            type="monotone"
            dataKey={userId}
            name={userNames[userId]}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
