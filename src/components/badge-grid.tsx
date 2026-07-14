'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Badge as BadgeType } from '@/lib/stats'

interface BadgeGridProps {
  badges: BadgeType[]
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {badges.map((badge) => (
        <Tooltip key={badge.id}>
          <TooltipTrigger>
            <div
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl cursor-default select-none transition-all',
                badge.unlocked
                  ? 'bg-card border border-border hover:scale-105'
                  : 'opacity-35 grayscale'
              )}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-[10px] font-medium text-center leading-tight">
                {badge.name}
              </span>
              {badge.threshold && !badge.unlocked && (
                <div className="w-full bg-muted rounded-full h-1">
                  <div
                    className="bg-primary h-1 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((badge.progress ?? 0) / badge.threshold) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{badge.name}</p>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
            {badge.threshold && !badge.unlocked && (
              <p className="text-xs mt-1">
                {badge.progress ?? 0} / {badge.threshold}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
