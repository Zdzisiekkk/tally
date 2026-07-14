/**
 * Mirror of DB calc_entry_total — used for live preview in entry-composer.
 * Source of truth is always the database trigger; this is for UI only.
 *
 * Formula:
 *   multiplier_sum = Σ value where type='multiplier_add'
 *   base_part      = Σ (value + multiplier_sum) * qty  where type='base'
 *   flat_part      = Σ value where type='flat_bonus'   (qty ignored)
 *   per_unit_part  = Σ value * qty                     where type='per_unit_bonus'
 *   total          = base_part + flat_part + per_unit_part
 *
 * Test cases (sanity check):
 *   Ruchanie(base5×1)+Lizanie(base1×1)+Torta(mult+2) = (5+2)+(1+2) = 10   ✓
 *   3× Ruchanie(base5×3)                              = 15                  ✓
 *   Ruchanie(base5×1)+Niepełnosprawna(flat50)         = 5+50 = 55           ✓
 *   4× dupa(per_unit1×4)                              = 4                   ✓
 *   Trójkąt(base10×1)+Torta(mult+2)+2×dupa(per1×2)   = (10+2)+2 = 14       ✓
 */

import type { ActivityType } from './types'

export interface PointsItem {
  activity_type: ActivityType
  activity_value: number
  qty: number
}

export function calcEntryTotal(items: PointsItem[]): number {
  const multiplierSum = items
    .filter((i) => i.activity_type === 'multiplier_add')
    .reduce((acc, i) => acc + i.activity_value, 0)

  const basePart = items
    .filter((i) => i.activity_type === 'base')
    .reduce((acc, i) => acc + (i.activity_value + multiplierSum) * i.qty, 0)

  const flatPart = items
    .filter((i) => i.activity_type === 'flat_bonus')
    .reduce((acc, i) => acc + i.activity_value, 0)

  const perUnitPart = items
    .filter((i) => i.activity_type === 'per_unit_bonus')
    .reduce((acc, i) => acc + i.activity_value * i.qty, 0)

  return basePart + flatPart + perUnitPart
}

/**
 * Format points with consistent decimal handling.
 * Integers show without decimals, fractions show up to 2 decimal places.
 */
export function formatPoints(value: number): string {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)
}
