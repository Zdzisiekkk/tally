'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { calcEntryTotal, formatPoints } from '@/lib/points'
import type { Activity, Profile } from '@/lib/types'

interface ComposerItem {
  activity: Activity
  qty: number
}

interface EntryComposerProps {
  groupId: string
  activities: Activity[]
  members: Profile[]
}

const typeLabel: Record<string, string> = {
  base: 'baza',
  multiplier_add: '+mnożnik',
  flat_bonus: '+bonus stały',
  per_unit_bonus: '+za szt.',
}

const typeColor: Record<string, string> = {
  base: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  multiplier_add: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  flat_bonus: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  per_unit_bonus: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
}

export function EntryComposer({ groupId, activities, members }: EntryComposerProps) {
  const [subjectId, setSubjectId] = useState<string>('')
  const [items, setItems] = useState<ComposerItem[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const activeActivities = activities.filter((a) => a.is_active)

  // Live sum (mirror of DB calc)
  const previewItems = items.map((i) => ({
    activity_type: i.activity.type,
    activity_value: Number(i.activity.value),
    qty: i.qty,
  }))
  const previewTotal = calcEntryTotal(previewItems)

  function addActivity(activityId: string) {
    const act = activities.find((a) => a.id === activityId)
    if (!act) return
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.activity.id === activityId)
      if (existing !== -1) {
        const next = [...prev]
        next[existing] = { ...next[existing], qty: next[existing].qty + 1 }
        return next
      }
      return [...prev, { activity: act, qty: 1 }]
    })
  }

  function changeQty(idx: number, delta: number) {
    setItems((prev) => {
      const next = [...prev]
      const newQty = next[idx].qty + delta
      if (newQty <= 0) {
        next.splice(idx, 1)
      } else {
        next[idx] = { ...next[idx], qty: newQty }
      }
      return next
    })
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId) { toast.error('Wybierz gracza'); return }
    if (items.length === 0) { toast.error('Dodaj co najmniej jedną aktywność'); return }

    setLoading(true)
    const rpcItems = items.map((i) => ({
      activity_id: i.activity.id,
      qty: i.qty,
    }))

    const { error } = await supabase.rpc('add_entry', {
      p_group: groupId,
      p_subject: subjectId,
      p_items: JSON.stringify(rpcItems),
      p_note: note || null,
    })

    setLoading(false)
    if (error) {
      toast.error(error.message === 'NOT_ADMIN' ? 'Tylko admin może dodawać wpisy' : error.message)
    } else {
      const sign = previewTotal >= 0 ? '+' : '−'
      toast.success(`Dodano ${sign}${formatPoints(Math.abs(previewTotal))} pkt!`)
      setItems([])
      setNote('')
      router.push(`/g/${groupId}/feed`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Player select */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Gracz</label>
        <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="Wybierz gracza..." />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity picker */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Aktywności</label>
        <div className="flex flex-wrap gap-2">
          {activeActivities.map((act) => (
            <Tooltip key={act.id}>
              <TooltipTrigger>
                <button
                  type="button"
                  onClick={() => addActivity(act.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent hover:scale-105 transition-all font-medium"
                >
                  {act.name}
                  <span className="ml-1.5 text-muted-foreground">{act.value}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{act.name}</p>
                <p className="text-xs text-muted-foreground">{typeLabel[act.type]} · {act.value} pkt</p>
                {act.type === 'flat_bonus' && (
                  <p className="text-xs mt-1 text-warning">Bonus stały — qty ignorowane</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Selected items */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium">Wybrane</label>
            {items.map((item, idx) => (
              <motion.div
                key={item.activity.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2"
              >
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeColor[item.activity.type]}`}>
                  {typeLabel[item.activity.type]}
                </span>
                <span className="flex-1 text-sm font-medium truncate">{item.activity.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => changeQty(idx, -1)}
                    className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="tabular-nums text-sm font-semibold w-5 text-center">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(idx, 1)}
                    className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                    disabled={item.activity.type === 'flat_bonus'}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="h-6 w-6 rounded-full text-destructive flex items-center justify-center hover:bg-destructive/10 transition-colors ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live preview */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={
              previewTotal < 0
                ? 'bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center'
                : 'bg-primary/10 border border-primary/20 rounded-xl p-4 text-center'
            }
          >
            <p className="text-xs text-muted-foreground mb-1">Podgląd sumy</p>
            <p
              className={
                previewTotal < 0
                  ? 'text-4xl font-bold tabular-nums text-destructive'
                  : 'text-4xl font-bold tabular-nums text-primary'
              }
            >
              {previewTotal >= 0 ? '+' : '−'}{formatPoints(Math.abs(previewTotal))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">pkt</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note */}
      <Input
        placeholder="Notatka (opcjonalnie)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <Button type="submit" className="w-full" disabled={loading || items.length === 0}>
        <Send className="mr-2 h-4 w-4" />
        {loading ? 'Zapisuję...' : 'Zapisz wpis'}
      </Button>
    </form>
  )
}
