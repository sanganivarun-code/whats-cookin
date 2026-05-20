import type { DayPlan, MealRecord, MealSlot } from '../types/meal'
import type { NutritionInfo, DayTotals, WeekAverages } from '../types/nutrition'
import type { OverrideMap } from '../types/store'

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner']

// Reusable zero-value to avoid repeated object literals
const ZERO: NutritionInfo = { kcal: 0, p: 0, c: 0, fat: 0, sugar: 0, fiber: 0 }

const add = (a: NutritionInfo, b: NutritionInfo): NutritionInfo => ({
  kcal:  a.kcal  + b.kcal,
  p:     a.p     + b.p,
  c:     a.c     + b.c,
  fat:   a.fat   + b.fat,
  sugar: a.sugar + b.sugar,
  fiber: a.fiber + b.fiber,
})

/**
 * Sums nutrition for all four slots in one day, ignoring any overrides.
 * Use calcDayTotalsWithOverrides when rendering the editable plan views.
 */
export function calcDayTotals(planDay: DayPlan, meals: MealRecord): DayTotals {
  return MEAL_SLOTS.reduce((acc, slot) => {
    const meal = meals[planDay[slot]]
    return meal ? add(acc, meal) : acc
  }, { ...ZERO })
}

/**
 * Like calcDayTotals but respects the user's manual edits:
 * - removed / eating-out slots are excluded from totals
 * - custom overrides count the substituted library meal's nutrition
 * - self-cook overrides are excluded (no nutrition data available)
 *
 * Note: leftover display (replacing lunch visually) is a UI concern;
 * the underlying planned lunch meal ID is still counted here.
 */
export function calcDayTotalsWithOverrides(
  dayIndex: number,
  planDay: DayPlan,
  meals: MealRecord,
  overrides: OverrideMap,
): DayTotals {
  return MEAL_SLOTS.reduce((acc, slot) => {
    const key = `${dayIndex}_${slot}`
    const override = overrides[key]

    if (override?.kind === 'removed' || override?.kind === 'eating-out') return acc

    // Custom override: count the substituted meal's nutrition
    const mealId = override?.kind === 'custom' ? override.mealId : planDay[slot]
    if (!mealId) return acc

    const meal = meals[mealId]
    return meal ? add(acc, meal) : acc
  }, { ...ZERO })
}

/**
 * Adds up nutrition across an array of day totals (e.g. the full week).
 */
export function calcWeekTotals(dayTotals: DayTotals[]): NutritionInfo {
  return dayTotals.reduce(add, { ...ZERO })
}

/**
 * Averages nutrition across the given days. All values rounded to the nearest
 * integer so they're ready to display without further formatting.
 * Returns zeroes if the input array is empty.
 */
export function calcWeekAvg(dayTotals: DayTotals[]): WeekAverages {
  if (dayTotals.length === 0) return { ...ZERO }
  const totals = calcWeekTotals(dayTotals)
  const n = dayTotals.length
  return {
    kcal:  Math.round(totals.kcal  / n),
    p:     Math.round(totals.p     / n),
    c:     Math.round(totals.c     / n),
    fat:   Math.round(totals.fat   / n),
    sugar: Math.round(totals.sugar / n),
    fiber: Math.round(totals.fiber / n),
  }
}

/**
 * Returns the percentage of total calories contributed by a macro group.
 * Protein and carbs contribute 4 kcal/g; fat contributes 9 kcal/g.
 * Returns 0 if totalKcal is 0 to avoid division by zero.
 */
export function macroPercent(
  grams: number,
  macro: 'protein' | 'carbs' | 'fat',
  totalKcal: number,
): number {
  if (totalKcal === 0) return 0
  const kcalPerGram = macro === 'fat' ? 9 : 4
  return Math.round((grams * kcalPerGram / totalKcal) * 100)
}
