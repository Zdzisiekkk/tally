import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatPoints } from '@/lib/points'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { MVP, Records } from '@/lib/stats'

interface StatHighlightsProps {
  records: Records
  form?: number[]
  percentileValue?: number
  mvp?: MVP | null
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return format(new Date(d + 'T00:00:00'), 'd MMM yyyy', { locale: pl })
}

/** Compact bar sparkline of the last N entry values. */
function FormBars({ values }: { values: number[] }) {
  const max = values.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1
  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((v, i) => {
        const h = Math.max(8, (Math.abs(v) / max) * 100)
        return (
          <div
            key={i}
            className={cn('flex-1 rounded-sm min-w-[6px]', v < 0 ? 'bg-destructive/70' : 'bg-primary/70')}
            style={{ height: `${h}%` }}
            title={`${formatPoints(v)} pkt`}
          />
        )
      })}
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-white/8 px-3 py-3 text-center">
      <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  )
}

export function StatHighlights({ records, form, percentileValue, mvp }: StatHighlightsProps) {
  return (
    <div className="space-y-4">
      {mvp && (
        <div className="flex items-center gap-3 rounded-2xl bg-card ring-1 ring-primary/40 card-glow px-3 py-2.5">
          <span className="text-xl" aria-hidden>⭐</span>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={mvp.avatar ?? undefined} className="object-cover" />
            <AvatarFallback className="text-xs font-bold">{mvp.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">MVP tygodnia</p>
            <p className="font-semibold text-sm truncate">{mvp.name}</p>
          </div>
          <p className="font-bold text-base tabular-nums text-primary shrink-0">{formatPoints(mvp.points)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Tile
          label="Rekord wpisu"
          value={formatPoints(records.biggestEntry)}
          sub={records.biggestEntryDate ? fmtDate(records.biggestEntryDate) : undefined}
        />
        <Tile
          label="Najlepszy dzień"
          value={records.bestDay ? formatPoints(records.bestDay.points) : '—'}
          sub={records.bestDay ? fmtDate(records.bestDay.date) : undefined}
        />
        <Tile label="Najlepszy tydzień" value={formatPoints(records.bestWeekPoints)} sub="7 dni" />
        <Tile
          label="Najdłuższy streak"
          value={String(records.longestStreak)}
          sub={`obecnie ${records.currentStreak}`}
        />
      </div>

      {typeof percentileValue === 'number' && (
        <div className="rounded-2xl bg-card ring-1 ring-white/8 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Percentyl w grupie</span>
            <span className="text-sm font-bold tabular-nums text-primary">TOP {100 - percentileValue}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-2 rounded-full grad-accent" style={{ width: `${percentileValue}%` }} />
          </div>
        </div>
      )}

      {form && form.length > 0 && (
        <div className="rounded-2xl bg-card ring-1 ring-white/8 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-2">Forma — ostatnie {form.length} wpisów</p>
          <FormBars values={form} />
        </div>
      )}
    </div>
  )
}
