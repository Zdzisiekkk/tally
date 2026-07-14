'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPoints } from '@/lib/points'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { DayCell } from '@/lib/stats'

interface CalendarHeatmapProps {
  cells: DayCell[]
}

const DAY_MS = 86400000
const WEEKDAYS = ['Pn', '', 'Śr', '', 'Pt', '', 'Nd']

/** Monday-based weekday index (0 = Monday … 6 = Sunday). */
function weekday(date: string): number {
  return (new Date(date + 'T00:00:00').getDay() + 6) % 7
}

/** Intensity bucket 0–4 for a cell relative to the busiest day. */
function level(points: number, max: number): number {
  if (points <= 0 || max <= 0) return 0
  const r = points / max
  if (r > 0.66) return 4
  if (r > 0.33) return 3
  if (r > 0.1) return 2
  return 1
}

const LEVEL_BG = [
  'bg-muted',
  'bg-primary/25',
  'bg-primary/50',
  'bg-primary/75',
  'bg-primary',
] as const

export function CalendarHeatmap({ cells }: CalendarHeatmapProps) {
  if (cells.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Brak danych</div>
  }

  // Pad the front so the first column starts on Monday.
  const pad = weekday(cells[0].date)
  const padded: (DayCell | null)[] = [...Array(pad).fill(null), ...cells]

  // Chunk into weeks (columns of 7 days).
  const weeks: (DayCell | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  const max = cells.reduce((m, c) => Math.max(m, c.points), 0)

  // Month labels above the columns where a new month starts.
  const monthLabels = weeks.map((week) => {
    const firstReal = week.find((c) => c)
    if (!firstReal) return ''
    const d = new Date(firstReal.date + 'T00:00:00')
    return d.getDate() <= 7 ? format(d, 'LLL', { locale: pl }) : ''
  })

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* Weekday labels */}
        <div className="flex flex-col gap-1 pt-[18px] shrink-0">
          {WEEKDAYS.map((d, i) => (
            <span
              key={i}
              className="h-3 text-[9px] leading-3 text-muted-foreground tabular-nums"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {/* Month row */}
          <div className="flex gap-1 h-[14px]">
            {monthLabels.map((label, i) => (
              <span
                key={i}
                className="w-3 text-[9px] leading-3 text-muted-foreground overflow-visible whitespace-nowrap"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, di) => {
                  const cell = week[di]
                  if (!cell) return <div key={di} className="h-3 w-3" />
                  const isFuture = new Date(cell.date + 'T00:00:00').getTime() > Date.now() + DAY_MS
                  if (isFuture) return <div key={di} className="h-3 w-3" />
                  return (
                    <Tooltip key={di}>
                      <TooltipTrigger>
                        <div
                          className={cn(
                            'h-3 w-3 rounded-[3px] ring-1 ring-inset ring-white/5',
                            LEVEL_BG[level(cell.points, max)]
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs font-semibold tabular-nums">
                          {formatPoints(cell.points)} pkt
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(cell.date + 'T00:00:00'), 'd MMM yyyy', { locale: pl })}
                          {cell.entries > 0 && ` · ${cell.entries} ${cell.entries === 1 ? 'wpis' : 'wpisów'}`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>mniej</span>
        {LEVEL_BG.map((bg, i) => (
          <div key={i} className={cn('h-3 w-3 rounded-[3px] ring-1 ring-inset ring-white/5', bg)} />
        ))}
        <span>więcej</span>
      </div>
    </div>
  )
}
