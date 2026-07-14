'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatPoints } from '@/lib/points'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { EntryFeedRow } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface EntryCardProps {
  entry: EntryFeedRow
  animate?: boolean
}

const typeLabel: Record<string, string> = {
  base: 'baza',
  multiplier_add: 'mnożnik',
  flat_bonus: 'bonus',
  per_unit_bonus: 'za szt.',
}

export function EntryCard({ entry, animate = false }: EntryCardProps) {
  const card = (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-4 space-y-3',
        animate && 'animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-300'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={entry.subject_avatar ?? undefined} />
            <AvatarFallback className="text-xs font-semibold">
              {entry.subject_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm leading-none">{entry.subject_name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(entry.occurred_at), { addSuffix: true, locale: pl })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl tabular-nums text-primary">
            +{formatPoints(Number(entry.total_points))}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">pkt</p>
        </div>
      </div>

      {entry.items && entry.items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.items.map((item, i) => (
            <Tooltip key={i}>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-xs cursor-default">
                  {item.qty > 1 ? `${item.qty}× ` : ''}{item.name}
                  {item.type === 'flat_bonus' && (
                    <span className="ml-1 text-muted-foreground">+{item.value}</span>
                  )}
                  {item.type === 'multiplier_add' && (
                    <span className="ml-1 text-warning">×{item.value}</span>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{typeLabel[item.type] ?? item.type} · wartość: {item.value}</p>
                {item.type === 'flat_bonus' && (
                  <p className="text-xs text-muted-foreground">Bonus stały — qty ignorowane</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {entry.note && (
        <p className="text-sm text-muted-foreground italic border-t border-border pt-2">
          &quot;{entry.note}&quot;
        </p>
      )}
    </div>
  )

  return card
}
