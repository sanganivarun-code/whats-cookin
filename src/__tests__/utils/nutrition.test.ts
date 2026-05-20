import {
  calcDayTotals,
  calcDayTotalsWithOverrides,
  calcWeekTotals,
  calcWeekAvg,
  macroPercent,
} from '../../utils/nutrition'
import type { DayPlan, MealRecord } from '../../types/meal'
import type { OverrideMap } from '../../types/store'

const meals: MealRecord = {
  a: { id: 'a', name: 'A', glyph: 'Bowl', tone: 'saffron', kcal: 400, p: 20, c: 50, fat: 10, sugar: 5, fiber: 3, time: 20 },
  b: { id: 'b', name: 'B', glyph: 'Roti', tone: 'paprika', kcal: 300, p: 15, c: 30, fat: 8,  sugar: 2, fiber: 2, time: 15 },
  c: { id: 'c', name: 'C', glyph: 'Glass', tone: 'olive',  kcal: 100, p: 5,  c: 10, fat: 2,  sugar: 1, fiber: 1, time: 5  },
  d: { id: 'd', name: 'D', glyph: 'Leaf',  tone: 'ink',   kcal: 600, p: 30, c: 60, fat: 15, sugar: 8, fiber: 5, time: 30 },
}

const plan: DayPlan = { breakfast: 'a', lunch: 'b', snack: 'c', dinner: 'd', leftover: null }

describe('calcDayTotals', () => {
  it('sums all four slots', () => {
    const totals = calcDayTotals(plan, meals)
    expect(totals.kcal).toBe(1400)
    expect(totals.p).toBe(70)
    expect(totals.c).toBe(150)
    expect(totals.fat).toBe(35)
    expect(totals.sugar).toBe(16)
    expect(totals.fiber).toBe(11)
  })

  it('skips missing meal IDs gracefully', () => {
    const sparseDay: DayPlan = { breakfast: 'a', lunch: 'missing', snack: 'c', dinner: 'also_missing', leftover: null }
    const totals = calcDayTotals(sparseDay, meals)
    expect(totals.kcal).toBe(500) // a + c
  })
})

describe('calcDayTotalsWithOverrides', () => {
  it('excludes removed slots', () => {
    const overrides: OverrideMap = { '0_dinner': { kind: 'removed' } }
    const totals = calcDayTotalsWithOverrides(0, plan, meals, overrides)
    expect(totals.kcal).toBe(800) // a + b + c, no d
  })

  it('excludes eating-out slots', () => {
    const overrides: OverrideMap = { '0_lunch': { kind: 'eating-out' } }
    const totals = calcDayTotalsWithOverrides(0, plan, meals, overrides)
    expect(totals.kcal).toBe(1100) // a + c + d, no b
  })

  it('substitutes custom override meal', () => {
    // Replace dinner (d=600) with snack meal (c=100)
    const overrides: OverrideMap = { '0_dinner': { kind: 'custom', mealId: 'c' } }
    const totals = calcDayTotalsWithOverrides(0, plan, meals, overrides)
    expect(totals.kcal).toBe(900) // a + b + c(snack) + c(custom for dinner)
  })

  it('treats default override same as no override', () => {
    const overrides: OverrideMap = { '0_breakfast': { kind: 'default' } }
    const totals = calcDayTotalsWithOverrides(0, plan, meals, overrides)
    expect(totals.kcal).toBe(1400)
  })

  it('uses dayIndex to key overrides correctly', () => {
    // Override only applies to day 2, not day 0
    const overrides: OverrideMap = { '2_dinner': { kind: 'removed' } }
    const totals = calcDayTotalsWithOverrides(0, plan, meals, overrides)
    expect(totals.kcal).toBe(1400)
  })
})

describe('calcWeekTotals', () => {
  it('sums across multiple day totals', () => {
    const day1 = calcDayTotals(plan, meals)
    const day2 = calcDayTotals(plan, meals)
    const week = calcWeekTotals([day1, day2])
    expect(week.kcal).toBe(2800)
    expect(week.p).toBe(140)
  })

  it('returns zero for empty array', () => {
    const week = calcWeekTotals([])
    expect(week.kcal).toBe(0)
  })
})

describe('calcWeekAvg', () => {
  it('averages and rounds to integers', () => {
    const d1 = { kcal: 1000, p: 50, c: 100, fat: 30, sugar: 10, fiber: 5 }
    const d2 = { kcal: 2000, p: 70, c: 200, fat: 50, sugar: 20, fiber: 9 }
    const avg = calcWeekAvg([d1, d2])
    expect(avg.kcal).toBe(1500)
    expect(avg.p).toBe(60)
    expect(avg.fiber).toBe(7) // Math.round(7/1) — (5+9)/2 = 7
  })

  it('returns zeroes for empty input', () => {
    const avg = calcWeekAvg([])
    expect(avg.kcal).toBe(0)
    expect(avg.p).toBe(0)
  })
})

describe('macroPercent', () => {
  it('calculates protein percent at 4 kcal/g', () => {
    expect(macroPercent(50, 'protein', 400)).toBe(50) // 50*4/400 = 50%
  })

  it('calculates fat percent at 9 kcal/g', () => {
    expect(macroPercent(10, 'fat', 180)).toBe(50) // 10*9/180 = 50%
  })

  it('calculates carbs percent at 4 kcal/g', () => {
    expect(macroPercent(25, 'carbs', 200)).toBe(50) // 25*4/200 = 50%
  })

  it('returns 0 when totalKcal is 0 (avoids divide by zero)', () => {
    expect(macroPercent(50, 'protein', 0)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    // 10*4/300 = 13.333...%
    expect(macroPercent(10, 'protein', 300)).toBe(13)
  })
})
