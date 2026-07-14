'use client'

import { useMemo, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { computeHeadToHead } from '@/lib/stats'
import { formatPoints } from '@/lib/points'
import { cn } from '@/lib/utils'
import type { EntryFeedRow } from '@/lib/types'

interface Member {
  user_id: string
  display_name: string
  avatar_url: string | null
}

interface HeadToHeadProps {
  members: Member[]
  entries: EntryFeedRow[]
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function Picker({
  value,
  onChange,
  members,
  exclude,
}: {
  value: string
  onChange: (v: string) => void
  members: Member[]
  exclude: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? value)}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {members
          .filter((m) => m.user_id !== exclude)
          .map((m) => (
            <SelectItem key={m.user_id} value={m.user_id}>
              {m.display_name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}

function Fighter({ member, points, entries, isLeader }: { member?: Member; points: number; entries: number; isLeader: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <Avatar className={cn('h-14 w-14', isLeader ? 'ring-2 ring-primary' : 'ring-1 ring-white/10')}>
        <AvatarImage src={member?.avatar_url ?? undefined} className="object-cover" />
        <AvatarFallback className="font-bold">{member ? initials(member.display_name) : '?'}</AvatarFallback>
      </Avatar>
      <p className="text-xs font-semibold max-w-[6rem] truncate">{member?.display_name ?? '—'}</p>
      <p className={cn('text-lg font-bold tabular-nums', isLeader && 'text-primary')}>
        {formatPoints(points)}
      </p>
      <p className="text-[10px] text-muted-foreground tabular-nums">
        {entries} {entries === 1 ? 'wpis' : 'wpisów'}
      </p>
    </div>
  )
}

export function HeadToHead({ members, entries }: HeadToHeadProps) {
  const [aId, setAId] = useState(members[0]?.user_id ?? '')
  const [bId, setBId] = useState(members[1]?.user_id ?? '')

  const a = members.find((m) => m.user_id === aId)
  const b = members.find((m) => m.user_id === bId)

  const h2h = useMemo(
    () => (aId && bId ? computeHeadToHead(entries, aId, bId) : null),
    [entries, aId, bId]
  )

  if (members.length < 2) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Potrzeba min. 2 graczy</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Picker value={aId} onChange={setAId} members={members} exclude={bId} />
        <Picker value={bId} onChange={setBId} members={members} exclude={aId} />
      </div>

      {h2h && (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Fighter member={a} points={h2h.aTotal} entries={h2h.aEntries} isLeader={h2h.leader === 'a'} />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">vs</span>
            <Fighter member={b} points={h2h.bTotal} entries={h2h.bEntries} isLeader={h2h.leader === 'b'} />
          </div>

          {h2h.perActivity.length > 0 && (
            <div className="space-y-2 pt-1">
              {h2h.perActivity.slice(0, 8).map((row) => {
                const total = row.a + row.b || 1
                const aPct = (row.a / total) * 100
                return (
                  <div key={row.activity} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={cn('tabular-nums font-semibold', row.a >= row.b && 'text-primary')}>
                        {formatPoints(row.a)}
                      </span>
                      <span className="text-muted-foreground truncate px-2">{row.activity}</span>
                      <span className={cn('tabular-nums font-semibold', row.b > row.a && 'text-primary')}>
                        {formatPoints(row.b)}
                      </span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                      <div className="bg-primary/80" style={{ width: `${aPct}%` }} />
                      <div className="bg-chart-2/70" style={{ width: `${100 - aPct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
