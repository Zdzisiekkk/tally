'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Activity, Category } from '@/lib/types'

interface ActivitiesClientProps {
  groupId: string
  initialActivities: Activity[]
  categories: Category[]
  isAdmin: boolean
}

const typeOptions = [
  { value: 'base', label: 'Baza' },
  { value: 'multiplier_add', label: 'Mnożnik (+)' },
  { value: 'flat_bonus', label: 'Bonus stały' },
  { value: 'per_unit_bonus', label: 'Za sztukę' },
]

const typeBadge: Record<string, string> = {
  base: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  multiplier_add: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  flat_bonus: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  per_unit_bonus: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
}

export function ActivitiesClient({ groupId, initialActivities, categories, isAdmin }: ActivitiesClientProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [form, setForm] = useState({ name: '', type: 'base', value: '1', category_id: '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  function openNew() {
    setEditing(null)
    setForm({ name: '', type: 'base', value: '1', category_id: '' })
    setDialogOpen(true)
  }

  function openEdit(act: Activity) {
    setEditing(act)
    setForm({
      name: act.name,
      type: act.type,
      value: String(act.value),
      category_id: act.category_id ?? '',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setLoading(true)

    const basePayload = {
      name: form.name.trim(),
      type: form.type as Activity['type'],
      value: parseFloat(form.value) || 0,
      category_id: form.category_id || null,
    }

    if (editing) {
      const { error } = await supabase
        .from('activities')
        .update(basePayload)
        .eq('id', editing.id)
      if (error) { toast.error(error.message); setLoading(false); return }
      setActivities((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...basePayload } : a))
      toast.success('Zaktualizowano')
    } else {
      const { data, error } = await supabase
        .from('activities')
        .insert({ ...basePayload, group_id: groupId, sort_order: activities.length })
        .select()
        .single()
      if (error) { toast.error(error.message); setLoading(false); return }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setActivities((prev) => [...prev, data as any as Activity])
      toast.success('Dodano aktywność')
    }

    setLoading(false)
    setDialogOpen(false)
    router.refresh()
  }

  async function toggleActive(act: Activity) {
    const { error } = await supabase
      .from('activities')
      .update({ is_active: !act.is_active })
      .eq('id', act.id)
    if (error) { toast.error(error.message); return }
    setActivities((prev) => prev.map((a) => a.id === act.id ? { ...a, is_active: !a.is_active } : a))
  }

  async function deleteActivity(act: Activity) {
    if (!confirm(`Usuń "${act.name}"? Historia wpisów zostanie zachowana.`)) return
    const { error } = await supabase.from('activities').delete().eq('id', act.id)
    if (error) { toast.error(error.message); return }
    setActivities((prev) => prev.filter((a) => a.id !== act.id))
    toast.success('Usunięto')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Aktywności</h2>
        {isAdmin && (
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Dodaj
          </Button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Brak aktywności</div>
      ) : (
        <div className="space-y-2">
          {activities.map((act) => {
            const cat = categories.find((c) => c.id === act.category_id)
            return (
              <Card key={act.id} className={act.is_active ? '' : 'opacity-50'}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{act.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeBadge[act.type]}`}>
                        {typeOptions.find((t) => t.value === act.type)?.label}
                      </span>
                      {cat && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ backgroundColor: cat.color + '22', color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Wartość: <span className="tabular-nums font-semibold">{act.value}</span>
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(act)}>
                        {act.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(act)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteActivity(act)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edytuj aktywność' : 'Nowa aktywność'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nazwa</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="np. Trening"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Typ</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v ?? 'base' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Wartość</label>
              <Input
                type="number"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>
            {categories.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Kategoria</label>
                <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Brak</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Zapisuję...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
