'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EntryFeedRow } from '@/lib/types'

export function useRealtimeFeed(groupId: string, initialData: EntryFeedRow[]) {
  const [feed, setFeed] = useState<EntryFeedRow[]>(initialData)
  const supabase = createClient()

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('entry_feed')
      .select('*')
      .eq('group_id', groupId)
      .order('occurred_at', { ascending: false })
      .limit(50)
    if (data) setFeed(data as EntryFeedRow[])
  }, [groupId, supabase])

  useEffect(() => {
    setFeed(initialData)
  }, [initialData])

  useEffect(() => {
    const channel = supabase
      .channel(`feed:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries', filter: `group_id=eq.${groupId}` },
        () => {
          refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, supabase, refresh])

  return feed
}
