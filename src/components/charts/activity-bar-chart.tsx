'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { StatsActivityRow } from '@/lib/types'

interface ActivityBarChartProps {
  data: StatsActivityRow[]
}

export function ActivityBarChart({ data }: ActivityBarChartProps) {
  const top10 = data.slice(0, 10)

  if (top10.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Brak danych</div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: '12px' }}
          formatter={(val) => [`${val} pkt`]}
        />
        <Bar dataKey="total" fill="#0A84FF" radius={[0, 4, 4, 0]} name="Punkty" />
      </BarChart>
    </ResponsiveContainer>
  )
}
