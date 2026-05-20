import type { DayPlan, MealRecord, MealSlot, Meal } from '../types/meal'
import type { Override, OverrideKind, OverrideMap } from '../types/store'

// ─── Slot metadata ─────────────────────────────────────────────────────────────

// Ordered list of meal slots — used anywhere the UI needs to iterate over a day.
// Exported so all screens share the same order without re-declaring it locally.
export const MEAL_SLOT_LIST: { key: MealSlot; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch',     label: 'Lunch'     },
  { key: 'snack',     label: 'Snack'     },
  { key: 'dinner',    label: 'Dinner'    },
]

// ─── Resolved slot ─────────────────────────────────────────────────────────────

// The fully resolved state of a meal slot after applying overrides.
// All screen-level rendering should work from this shape, not from raw overrides.
export interface ResolvedSlot {
  kind: OverrideKind
  meal: Meal | null  // null for eating-out, removed, and self-cook without a library match
  name?: string      // set for self-cook ('I'll cook my own') and custom overrides
}

/**
 * Returns the display state for a single meal slot, applying any user override.
 *
 * Pure — all inputs are explicit so this can be tested without global state.
 * Override precedence:
 *   eating-out → meal = null
 *   removed    → meal = null
 *   self-cook  → meal = null (user-defined recipe, no library entry)
 *   custom     → meal = library meal with override.mealId
 *   default    → restore the originally planned meal
 *   (no override) → originally planned meal
 */
export function resolveSlot(
  dayIndex: number,
  slot: MealSlot,
  planDay: DayPlan,
  meals: MealRecord,
  overrides: OverrideMap,
): ResolvedSlot {
  const key = `${dayIndex}_${slot}`
  const override: Override | undefined = overrides[key]

  // 'default' kind means "clear the override" — treat as if no override exists
  if (!override || override.kind === 'default') {
    return { kind: 'default', meal: meals[planDay[slot]] ?? null }
  }

  const meal = override.mealId ? (meals[override.mealId] ?? null) : null
  return { kind: override.kind, meal, name: override.name }
}

// ─── Ingredient scaling ────────────────────────────────────────────────────────

// Unicode fractions that appear in ingredient amounts
const FRACS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667,
}

/**
 * Scales a free-form ingredient amount string by `ratio`.
 * Handles Unicode fractions and decimal numbers. Returns the original string
 * unchanged if it cannot be parsed (e.g. "a pinch", "to taste").
 *
 * Examples:
 *   scaleAmt("9 oz",   2)   → "18 oz"
 *   scaleAmt("½ tsp",  2)   → "1 tsp"
 *   scaleAmt("1 tbsp", 0.5) → "0.5 tbsp"
 *   scaleAmt("to taste", 2) → "to taste"
 */
export function scaleAmt(amt: string, ratio: number): string {
  if (ratio === 1) return amt

  const match = amt.match(/^([\d.½¼¾⅓⅔]+)\s*(.*)$/)
  if (!match) return amt

  const num = FRACS[match[1]] ?? parseFloat(match[1])
  if (isNaN(num)) return amt

  const scaled = num * ratio
  const formatted =
    scaled < 1
      ? scaled.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
      : String(Math.round(scaled * 10) / 10)

  return `${formatted} ${match[2]}`.trim()
}

// ─── Onboarding helpers ────────────────────────────────────────────────────────

/**
 * Human-readable summary of how batch cooking affects the weekly schedule.
 * Shown as a hint below the batch-dinner stepper in the Kitchen onboarding step.
 *
 * n = 0  → cook every dinner fresh (7 active sessions)
 * n = 7  → every dinner stretches to next-day lunch (4 active sessions)
 *
 * FUTURE: this logic feeds into the Gemini prompt to bias how many
 * "leftover" slots are included in the generated plan.
 */
export function batchPreview(n: number): string {
  if (n === 0) return "You'll cook every dinner fresh — 7 cook sessions a week."
  if (n === 7) return 'Every dinner gets stretched. Just 4 active cook days a week.'
  const sessions = 7 - Math.floor(n / 2)
  return (
    `About ${sessions} active cook sessions a week. ` +
    `${n} dinner${n > 1 ? 's' : ''} will reappear as next-day lunches.`
  )
}

// ─── Routing helpers ───────────────────────────────────────────────────────────

/**
 * Maps a route key to the screen label shown in the page header.
 * Falls back to the raw route string for any unrecognised value.
 */
export function routeLabel(route: string): string {
  const LABELS: Record<string, string> = {
    landing:    '01 Landing',
    onboarding: '02 Onboarding',
    today:      '03 Today',
    dashboard:  '04 Weekly plan',
    recipe:     '05 Recipe detail',
    grocery:    '06 Grocery list',
    nutrition:  '07 Nutrition summary',
  }
  return LABELS[route] ?? route
}
