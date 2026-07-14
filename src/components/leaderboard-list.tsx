import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { formatPoints } from '@/lib/points'
import type { LeaderboardRow } from '@/lib/types'
import { cn } from '@/lib/utils'

interface LeaderboardListProps {
  rows: LeaderboardRow[]
  currentUserId?: string
  /** user_id → rank change vs last week (positive = moved up). */
  momentum?: Record<string, number>
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

/** Small up/down/steady indicator for weekly rank movement. */
function Momentum({ delta }: { delta: number | undefined }) {
  if (delta == null) return null
  if (delta === 0) {
    return <Minus className="h-3 w-3 text-muted-foreground/60 shrink-0" aria-label="bez zmian" />
  }
  const up = delta > 0
  return (
    <span
      className={cn(
        'flex items-center text-[10px] font-bold tabular-nums shrink-0',
        up ? 'text-success' : 'text-destructive'
      )}
      aria-label={up ? `awans o ${delta}` : `spadek o ${-delta}`}
    >
      {up ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  )
}

/* Podium seat for a single top-3 player */
function PodiumSeat({
  row,
  rank,
  isMe,
}: {
  row: LeaderboardRow
  rank: number
  isMe: boolean
}) {
  const size = rank === 1 ? 'h-24 w-24' : 'h-16 w-16'
  const ring =
    rank === 1
      ? 'ring-2 ring-primary'
      : 'ring-1 ring-white/15'
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both',
        rank === 1 ? 'order-2 -translate-y-3' : rank === 2 ? 'order-1' : 'order-3'
      )}
      style={{ animationDelay: `${(rank - 1) * 60}ms` }}
    >
      <div className="relative">
        <Avatar className={cn(size, 'rounded-full', ring, 'shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]')}>
          <AvatarImage src={row.avatar_url ?? undefined} className="object-cover" />
          <AvatarFallback className="text-lg font-bold bg-secondary">
            {initials(row.display_name)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
            rank === 1 ? 'grad-accent text-white' : 'bg-card text-foreground ring-1 ring-white/10'
          )}
        >
          #{rank}
        </span>
      </div>
      <p className={cn('mt-4 text-sm font-bold leading-tight max-w-[7rem] truncate', isMe && 'text-primary')}>
        {row.display_name}
      </p>
      <p className="mt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
        {formatPoints(Number(row.total))} pkt
      </p>
    </div>
  )
}

export function LeaderboardList({ rows, currentUserId, momentum }: LeaderboardListProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Brak danych. Dodaj pierwszy wpis!
      </div>
    )
  }

  const top = rows.slice(0, 3)
  const rest = rows.slice(3)

  return (
    <div className="space-y-4">
      {/* Podium */}
      <div className="relative overflow-hidden rounded-3xl bg-card ring-1 ring-white/10 card-glow px-4 pt-10 pb-6">
        <div className="absolute inset-x-0 top-0 h-40 bg-podium pointer-events-none" />
        <div className="relative flex items-end justify-center gap-3 sm:gap-6">
          {top.map((row, idx) => (
            <PodiumSeat
              key={row.user_id}
              row={row}
              rank={idx + 1}
              isMe={row.user_id === currentUserId}
            />
          ))}
        </div>
      </div>

      {/* Remaining ranks */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((row, idx) => {
            const rank = idx + 4
            const isMe = row.user_id === currentUserId
            return (
              <div
                key={row.user_id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5 ring-1 ring-white/8 animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-both',
                  isMe && 'ring-2 ring-primary'
                )}
                style={{ animationDelay: `${Math.min(idx * 25, 300)}ms` }}
              >
                <span className="w-6 text-center text-sm font-bold tabular-nums text-muted-foreground shrink-0">
                  {rank}
                </span>
                {momentum && <Momentum delta={momentum[row.user_id]} />}
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={row.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs font-bold">{initials(row.display_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold text-sm truncate', isMe && 'text-primary')}>
                    {row.display_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {row.entries_count} {row.entries_count === 1 ? 'wpis' : 'wpisów'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-base tabular-nums">{formatPoints(Number(row.total))}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">pkt</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
