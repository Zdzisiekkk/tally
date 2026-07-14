'use client'

import { useRealtimeFeed } from '@/hooks/use-realtime-feed'
import { EntryCard } from '@/components/entry-card'
import type { EntryFeedRow } from '@/lib/types'

interface FeedClientProps {
  groupId: string
  initialData: EntryFeedRow[]
}

export function FeedClient({ groupId, initialData }: FeedClientProps) {
  const feed = useRealtimeFeed(groupId, initialData)

  if (feed.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Brak wpisów. Dodaj pierwszy!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {feed.map((entry, i) => (
        <EntryCard key={entry.id} entry={entry} animate={i === 0} />
      ))}
    </div>
  )
}
