'use client'

import { formatPoints } from '@/lib/points'
import type { CategorySlice } from '@/lib/stats'

interface CategoryBreakdownProps {
  data: CategorySlice[]
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Brak danych</div>
  }

  const total = data.reduce((s, d) => s + d.points, 0) || 1
  const top = data.slice(0, 6)
  const rest = data.slice(6)
  const restPoints = rest.reduce((s, d) => s + d.points, 0)
  const slices = restPoints > 0 ? [...top, { name: 'Pozostałe', points: restPoints }] : top

  return (
    <div className="space-y-3">
      {/* Stacked proportion bar */}
      <div className="flex h-3 overflow-hidden rounded-full ring-1 ring-inset ring-white/5">
        {slices.map((s, i) => (
          <div
            key={s.name}
            style={{ width: `${(s.points / total) * 100}%`, background: COLORS[i % COLORS.length] }}
          />
        ))}
      </div>

      {/* Legend rows */}
      <div className="space-y-1.5">
        {slices.map((s, i) => (
          <div key={s.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="flex-1 truncate">{s.name}</span>
            <span className="text-muted-foreground tabular-nums text-xs">
              {Math.round((s.points / total) * 100)}%
            </span>
            <span className="font-semibold tabular-nums w-14 text-right">{formatPoints(s.points)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
