import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatPoints } from '@/lib/points'
import { cn } from '@/lib/utils'
import type { SeasonWinner } from '@/lib/stats'

interface SeasonTrophiesProps {
  winners: SeasonWinner[]
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

export function SeasonTrophies({ winners }: SeasonTrophiesProps) {
  if (winners.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Brak zakończonych sezonów</div>
  }

  return (
    <div className="space-y-2">
      {winners.map((w, i) => (
        <div
          key={w.month}
          className={cn(
            'flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1',
            i === 0 ? 'bg-card ring-primary/40 card-glow' : 'bg-card ring-white/8'
          )}
        >
          <span className="text-xl" aria-hidden>🏆</span>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={w.avatar ?? undefined} className="object-cover" />
            <AvatarFallback className="text-xs font-bold">{initials(w.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{w.name}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{w.label}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-base tabular-nums">{formatPoints(w.points)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">pkt</p>
          </div>
        </div>
      ))}
    </div>
  )
}
