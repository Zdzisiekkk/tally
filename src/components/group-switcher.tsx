'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, Plus, Hash } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { Group } from '@/lib/types'

interface GroupSwitcherProps {
  groups: Group[]
  currentGroupId?: string
}

export function GroupSwitcher({ groups, currentGroupId }: GroupSwitcherProps) {
  const router = useRouter()
  const current = groups.find((g) => g.id === currentGroupId)

  function switchGroup(groupId: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tally:lastGroupId', groupId)
    }
    router.push(`/g/${groupId}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" className="flex items-center gap-1.5 max-w-[200px]">
          <Hash className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate font-semibold">{current?.name ?? 'Wybierz grupę'}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {groups.map((g) => (
          <DropdownMenuItem
            key={g.id}
            onClick={() => switchGroup(g.id)}
            className={g.id === currentGroupId ? 'font-semibold text-primary' : ''}
          >
            <Hash className="mr-2 h-3.5 w-3.5" />
            {g.name}
          </DropdownMenuItem>
        ))}
        {groups.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={() => router.push('/new-group')}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Nowa grupa
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/join')}>
          <Hash className="mr-2 h-3.5 w-3.5" />
          Dołącz do grupy
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
