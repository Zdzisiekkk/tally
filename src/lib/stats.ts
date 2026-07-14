import type { EntryFeedRow, LeaderboardRow } from './types'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress?: number
  threshold?: number
}

export function computeBadges(
  userTotal: number,
  entries: EntryFeedRow[],
  userId: string
): Badge[] {
  const userEntries = entries.filter((e) => e.subject_id === userId)
  const entryCount = userEntries.length
  const totalPoints = userTotal

  // Streak: consecutive days with at least 1 entry
  const daySet = new Set(userEntries.map((e) => e.occurred_at.slice(0, 10)))
  const days = Array.from(daySet).sort()
  let streak = 0
  let maxStreak = 0
  let prev: string | null = null
  for (const d of days) {
    if (prev) {
      const diff = (new Date(d).getTime() - new Date(prev).getTime()) / 86400000
      streak = diff === 1 ? streak + 1 : 1
    } else {
      streak = 1
    }
    maxStreak = Math.max(maxStreak, streak)
    prev = d
  }

  // Kombinator: entry with 3+ activities
  const kombinatorCount = userEntries.filter(
    (e) => e.items && e.items.length >= 3
  ).length

  // Modyfikator master: entries with multiplier
  const modMasterCount = userEntries.filter(
    (e) => e.items && e.items.some((i) => i.type === 'multiplier_add')
  ).length

  // Biggest single entry
  const biggestEntry = userEntries.reduce((max, e) => Math.max(max, e.total_points), 0)

  // Willowy: per_unit_bonus qty total
  const willowyCount = userEntries.reduce((acc, e) => {
    if (!e.items) return acc
    return acc + e.items.filter((i) => i.type === 'per_unit_bonus').reduce((s, i) => s + i.qty, 0)
  }, 0)

  return [
    {
      id: 'debut',
      name: 'Debiut',
      description: 'Pierwszy wpis',
      icon: '🎯',
      unlocked: entryCount >= 1,
    },
    {
      id: 'bronze',
      name: 'Brąz',
      description: '100 punktów',
      icon: '🥉',
      unlocked: totalPoints >= 100,
      progress: Math.min(totalPoints, 100),
      threshold: 100,
    },
    {
      id: 'silver',
      name: 'Srebro',
      description: '500 punktów',
      icon: '🥈',
      unlocked: totalPoints >= 500,
      progress: Math.min(totalPoints, 500),
      threshold: 500,
    },
    {
      id: 'gold',
      name: 'Złoto',
      description: '1000 punktów',
      icon: '🥇',
      unlocked: totalPoints >= 1000,
      progress: Math.min(totalPoints, 1000),
      threshold: 1000,
    },
    {
      id: 'streak3',
      name: 'Regularny',
      description: 'Streak 3 dni',
      icon: '🔥',
      unlocked: maxStreak >= 3,
      progress: Math.min(maxStreak, 3),
      threshold: 3,
    },
    {
      id: 'streak7',
      name: 'Tygodnik',
      description: 'Streak 7 dni',
      icon: '⚡',
      unlocked: maxStreak >= 7,
      progress: Math.min(maxStreak, 7),
      threshold: 7,
    },
    {
      id: 'streak14',
      name: 'Maratończyk',
      description: 'Streak 14 dni',
      icon: '💎',
      unlocked: maxStreak >= 14,
      progress: Math.min(maxStreak, 14),
      threshold: 14,
    },
    {
      id: 'kombinator',
      name: 'Kombinator',
      description: '3+ aktywności w wpisie',
      icon: '🎰',
      unlocked: kombinatorCount >= 1,
    },
    {
      id: 'mod_master',
      name: 'Modyfikator Master',
      description: '10 wpisów z mnożnikiem',
      icon: '✨',
      unlocked: modMasterCount >= 10,
      progress: Math.min(modMasterCount, 10),
      threshold: 10,
    },
    {
      id: 'rekordzista',
      name: 'Rekordzista',
      description: 'Największy pojedynczy wpis',
      icon: '👑',
      unlocked: biggestEntry > 0,
    },
    {
      id: 'willowy',
      name: 'Willowy',
      description: 'Dupa na willę (per_unit ×10)',
      icon: '🏠',
      unlocked: willowyCount >= 10,
      progress: Math.min(willowyCount, 10),
      threshold: 10,
    },
  ]
}

export function computeStreak(entries: EntryFeedRow[], userId: string): number {
  const userEntries = entries.filter((e) => e.subject_id === userId)
  const daySet = new Set(userEntries.map((e) => e.occurred_at.slice(0, 10)))
  const days = Array.from(daySet).sort().reverse()

  if (days.length === 0) return 0

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (days[0] !== today && days[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

export function getLeaderboardPosition(leaderboard: LeaderboardRow[], userId: string): number {
  const idx = leaderboard.findIndex((r) => r.user_id === userId)
  return idx === -1 ? 0 : idx + 1
}

/* ───────────────────────── Extended analytics ───────────────────────── */

const DAY = 86400000
const dayKey = (d: Date | string) =>
  (typeof d === 'string' ? new Date(d) : d).toISOString().slice(0, 10)

function filterUser(entries: EntryFeedRow[], userId?: string) {
  return userId ? entries.filter((e) => e.subject_id === userId) : entries
}

export interface DayCell {
  date: string
  points: number
  entries: number
}

/** Continuous daily buckets from `days` ago until today (oldest → newest). */
export function computeCalendar(
  entries: EntryFeedRow[],
  opts: { userId?: string; days?: number } = {}
): DayCell[] {
  const { userId, days = 133 } = opts
  const rows = filterUser(entries, userId)
  const map = new Map<string, { points: number; entries: number }>()
  for (const e of rows) {
    const k = dayKey(e.occurred_at)
    const cur = map.get(k) ?? { points: 0, entries: 0 }
    cur.points += Number(e.total_points)
    cur.entries += 1
    map.set(k, cur)
  }
  const out: DayCell[] = []
  const start = new Date(Date.now() - (days - 1) * DAY)
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * DAY)
    const k = dayKey(d)
    const hit = map.get(k)
    out.push({ date: k, points: hit?.points ?? 0, entries: hit?.entries ?? 0 })
  }
  return out
}

export interface Records {
  totalPoints: number
  totalEntries: number
  avgPerEntry: number
  biggestEntry: number
  biggestEntryDate: string | null
  bestDay: { date: string; points: number } | null
  bestWeekPoints: number
  longestStreak: number
  currentStreak: number
}

export function computeRecords(entries: EntryFeedRow[], userId?: string): Records {
  const rows = filterUser(entries, userId)
  const totalPoints = rows.reduce((s, e) => s + Number(e.total_points), 0)
  const totalEntries = rows.length

  let biggestEntry = 0
  let biggestEntryDate: string | null = null
  const byDay = new Map<string, number>()
  for (const e of rows) {
    const p = Number(e.total_points)
    if (p > biggestEntry) {
      biggestEntry = p
      biggestEntryDate = dayKey(e.occurred_at)
    }
    const k = dayKey(e.occurred_at)
    byDay.set(k, (byDay.get(k) ?? 0) + p)
  }

  let bestDay: { date: string; points: number } | null = null
  for (const [date, points] of byDay) {
    if (!bestDay || points > bestDay.points) bestDay = { date, points }
  }

  // best rolling 7-day window
  const days = Array.from(byDay.keys()).sort()
  let bestWeekPoints = 0
  for (const d of days) {
    const end = new Date(d).getTime()
    let sum = 0
    for (let i = 0; i < 7; i++) {
      sum += byDay.get(dayKey(new Date(end - i * DAY))) ?? 0
    }
    bestWeekPoints = Math.max(bestWeekPoints, sum)
  }

  const daySet = Array.from(new Set(rows.map((e) => dayKey(e.occurred_at)))).sort()
  let longestStreak = 0
  let run = 0
  let prev: string | null = null
  for (const d of daySet) {
    if (prev && (new Date(d).getTime() - new Date(prev).getTime()) / DAY === 1) run += 1
    else run = 1
    longestStreak = Math.max(longestStreak, run)
    prev = d
  }

  const currentStreak = userId ? computeStreak(entries, userId) : 0

  return {
    totalPoints,
    totalEntries,
    avgPerEntry: totalEntries > 0 ? totalPoints / totalEntries : 0,
    biggestEntry,
    biggestEntryDate,
    bestDay,
    bestWeekPoints,
    longestStreak,
    currentStreak,
  }
}

/** Last n entry point-values, chronological (oldest → newest). */
export function computeForm(entries: EntryFeedRow[], userId: string, n = 6): number[] {
  return filterUser(entries, userId)
    .slice()
    .sort((a, b) => +new Date(a.occurred_at) - +new Date(b.occurred_at))
    .slice(-n)
    .map((e) => Number(e.total_points))
}

function pointsInWindow(entries: EntryFeedRow[], fromMs: number, toMs: number) {
  const map = new Map<string, number>()
  for (const e of entries) {
    const t = +new Date(e.occurred_at)
    if (t >= fromMs && t < toMs) {
      map.set(e.subject_id, (map.get(e.subject_id) ?? 0) + Number(e.total_points))
    }
  }
  return map
}

/** Rank change vs previous 7-day window. Positive = moved up. */
export function computeRankMomentum(entries: EntryFeedRow[]): Map<string, number> {
  const now = Date.now()
  const cur = pointsInWindow(entries, now - 7 * DAY, now + DAY)
  const prev = pointsInWindow(entries, now - 14 * DAY, now - 7 * DAY)

  const rankOf = (m: Map<string, number>) => {
    const sorted = Array.from(m.entries()).sort((a, b) => b[1] - a[1])
    const r = new Map<string, number>()
    sorted.forEach(([id], i) => r.set(id, i + 1))
    return r
  }
  const curRank = rankOf(cur)
  const prevRank = rankOf(prev)

  const delta = new Map<string, number>()
  for (const [id, cr] of curRank) {
    const pr = prevRank.get(id)
    if (pr != null) delta.set(id, pr - cr)
  }
  return delta
}

export interface MVP {
  user_id: string
  name: string
  avatar: string | null
  points: number
}

/** Top scorer in the last `days` days. */
export function computeMVP(entries: EntryFeedRow[], days = 7): MVP | null {
  const from = Date.now() - days * DAY
  const agg = new Map<string, MVP>()
  for (const e of entries) {
    if (+new Date(e.occurred_at) < from) continue
    const cur =
      agg.get(e.subject_id) ??
      { user_id: e.subject_id, name: e.subject_name, avatar: e.subject_avatar, points: 0 }
    cur.points += Number(e.total_points)
    agg.set(e.subject_id, cur)
  }
  let best: MVP | null = null
  for (const v of agg.values()) if (!best || v.points > best.points) best = v
  return best && best.points > 0 ? best : null
}

export interface CategorySlice {
  name: string
  points: number
}

/** Points grouped by activity name. */
export function computeCategoryBreakdown(
  entries: EntryFeedRow[],
  userId?: string
): CategorySlice[] {
  const rows = filterUser(entries, userId)
  const map = new Map<string, number>()
  for (const e of rows) {
    if (!e.items) continue
    for (const it of e.items) {
      // attribute the entry proportionally is complex; use activity value*qty as weight
      const w = Math.abs(Number(it.value)) * Math.max(1, it.qty)
      map.set(it.name, (map.get(it.name) ?? 0) + w)
    }
  }
  return Array.from(map.entries())
    .map(([name, points]) => ({ name, points }))
    .sort((a, b) => b.points - a.points)
}

export interface H2HStat {
  activity: string
  a: number
  b: number
}
export interface HeadToHead {
  aTotal: number
  bTotal: number
  aEntries: number
  bEntries: number
  perActivity: H2HStat[]
  leader: 'a' | 'b' | 'tie'
}

export function computeHeadToHead(
  entries: EntryFeedRow[],
  aId: string,
  bId: string
): HeadToHead {
  const a = entries.filter((e) => e.subject_id === aId)
  const b = entries.filter((e) => e.subject_id === bId)
  const aTotal = a.reduce((s, e) => s + Number(e.total_points), 0)
  const bTotal = b.reduce((s, e) => s + Number(e.total_points), 0)

  const acc = new Map<string, { a: number; b: number }>()
  const add = (rows: EntryFeedRow[], side: 'a' | 'b') => {
    for (const e of rows) {
      if (!e.items) continue
      for (const it of e.items) {
        const cur = acc.get(it.name) ?? { a: 0, b: 0 }
        cur[side] += Math.abs(Number(it.value)) * Math.max(1, it.qty)
        acc.set(it.name, cur)
      }
    }
  }
  add(a, 'a')
  add(b, 'b')

  const perActivity = Array.from(acc.entries())
    .map(([activity, v]) => ({ activity, a: v.a, b: v.b }))
    .sort((x, y) => y.a + y.b - (x.a + x.b))

  return {
    aTotal,
    bTotal,
    aEntries: a.length,
    bEntries: b.length,
    perActivity,
    leader: aTotal === bTotal ? 'tie' : aTotal > bTotal ? 'a' : 'b',
  }
}

export interface SeasonWinner {
  month: string // YYYY-MM
  label: string
  user_id: string
  name: string
  avatar: string | null
  points: number
}

/** Monthly "seasons" — winner per calendar month (most recent first). */
export function computeSeasonWinners(entries: EntryFeedRow[]): SeasonWinner[] {
  const byMonth = new Map<string, Map<string, MVP>>()
  for (const e of entries) {
    const month = dayKey(e.occurred_at).slice(0, 7)
    const m = byMonth.get(month) ?? new Map<string, MVP>()
    const cur =
      m.get(e.subject_id) ??
      { user_id: e.subject_id, name: e.subject_name, avatar: e.subject_avatar, points: 0 }
    cur.points += Number(e.total_points)
    m.set(e.subject_id, cur)
    byMonth.set(month, m)
  }

  const months = Array.from(byMonth.keys()).sort().reverse()
  const MONTHS_PL = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']
  const out: SeasonWinner[] = []
  for (const month of months) {
    const m = byMonth.get(month)!
    let best: MVP | null = null
    for (const v of m.values()) if (!best || v.points > best.points) best = v
    if (best && best.points > 0) {
      const [y, mo] = month.split('-')
      out.push({
        month,
        label: `${MONTHS_PL[Number(mo) - 1]} ${y}`,
        user_id: best.user_id,
        name: best.name,
        avatar: best.avatar,
        points: best.points,
      })
    }
  }
  return out
}

export function percentile(leaderboard: LeaderboardRow[], userId: string): number {
  const n = leaderboard.length
  if (n <= 1) return 100
  const idx = leaderboard.findIndex((r) => r.user_id === userId)
  if (idx === -1) return 0
  return Math.round(((n - idx - 1) / (n - 1)) * 100)
}
