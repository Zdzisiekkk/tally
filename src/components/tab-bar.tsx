'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, BarChart2, Rss, Zap, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabBarProps {
  groupId: string
}

const tabs = [
  { label: 'Ranking', href: '', icon: Trophy },
  { label: 'Stats', href: '/stats', icon: BarChart2 },
  { label: 'Feed', href: '/feed', icon: Rss },
  { label: 'Aktywności', href: '/activities', icon: Zap },
  { label: 'Członkowie', href: '/members', icon: Users },
]

export function TabBar({ groupId }: TabBarProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-stretch max-w-lg mx-auto">
        {tabs.map((tab) => {
          const href = `/g/${groupId}${tab.href}`
          const isActive = pathname === href || (tab.href === '' && pathname === `/g/${groupId}`)
          const Icon = tab.icon
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[10px] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
