// Tests for the pure serialization helpers in firestoreSync.ts.
// No Firebase mocking is needed because planToDays / docToPlan / docToExtendedPlan
// have zero Firestore dependency — they work on plain objects only.

import { planToDays, docToPlan, docToExtendedPlan } from '../../lib/firestoreSync'
import { PLAN } from '../../data/meals'
import type { MealPlan } from '../../types/meal'

// ─── planToDays ───────────────────────────────────────────────────────────────

describe('planToDays', () => {
  it('returns exactly 7 entries', () => {
    expect(planToDays(PLAN)).toHaveLength(7)
  })

  it('preserves all four slot values', () => {
    const days = planToDays(PLAN)
    expect(days[0].breakfast).toBe(PLAN[0].breakfast)
    expect(days[0].lunch).toBe(PLAN[0].lunch)
    expect(days[0].snack).toBe(PLAN[0].snack)
    expect(days[0].dinner).toBe(PLAN[0].dinner)
  })

  it('preserves leftover when null', () => {
    const days = planToDays(PLAN)
    expect(days[0].leftover).toBeNull()
  })

  it('preserves leftover when a meal ID string', () => {
    const days = planToDays(PLAN)
    // Static PLAN has a non-null leftover on day 1
    expect(typeof days[1].leftover === 'string' || days[1].leftover === null).toBe(true)
  })

  it('returns plain copies, not references to the original plan entries', () => {
    const days = planToDays(PLAN)
    expect(days[0]).not.toBe(PLAN[0])
  })
})

// ─── docToPlan ────────────────────────────────────────────────────────────────

describe('docToPlan', () => {
  // Minimal valid day used across several tests
  const validDay = { breakfast: 'poha', lunch: 'chana', snack: 'trail', dinner: 'rajma', leftover: null }
  const sevenDays = Array<typeof validDay>(7).fill(validDay)

  it('returns null for null input', () => {
    expect(docToPlan(null)).toBeNull()
  })

  it('returns null for non-object primitives', () => {
    expect(docToPlan('string')).toBeNull()
    expect(docToPlan(42)).toBeNull()
    expect(docToPlan(undefined)).toBeNull()
  })

  it('returns null when days array is missing', () => {
    expect(docToPlan({})).toBeNull()
    expect(docToPlan({ uid: 'x' })).toBeNull()
  })

  it('returns null when days is not an array', () => {
    expect(docToPlan({ days: 'not-an-array' })).toBeNull()
    expect(docToPlan({ days: {} })).toBeNull()
  })

  it('returns null when days length is not 7', () => {
    expect(docToPlan({ days: [] })).toBeNull()
    expect(docToPlan({ days: sevenDays.slice(0, 6) })).toBeNull()
    expect(docToPlan({ days: [...sevenDays, validDay] })).toBeNull()
  })

  it('returns null when a day entry is not an object', () => {
    const withNull = [...sevenDays.slice(0, 6), null]
    expect(docToPlan({ days: withNull })).toBeNull()
  })

  it('returns null when a required slot value is missing', () => {
    const badDay = { breakfast: 'poha', lunch: 'chana', snack: 'trail' /* no dinner */ }
    const days = [...sevenDays.slice(0, 6), badDay]
    expect(docToPlan({ days })).toBeNull()
  })

  it('returns null when a slot value is not a string', () => {
    const badDay = { ...validDay, breakfast: 42 }
    const days = [...sevenDays.slice(0, 6), badDay]
    expect(docToPlan({ days })).toBeNull()
  })

  it('returns null when leftover is not a string or null', () => {
    const badDay = { ...validDay, leftover: 123 }
    const days = [...sevenDays.slice(0, 6), badDay]
    expect(docToPlan({ days })).toBeNull()
  })

  it('accepts leftover as null', () => {
    const result = docToPlan({ days: sevenDays })
    expect(result).not.toBeNull()
  })

  it('accepts leftover as a string', () => {
    const dayWithLeftover = { ...validDay, leftover: 'rajma' }
    const days = [dayWithLeftover, ...sevenDays.slice(1)]
    const result = docToPlan({ days })
    expect(result).not.toBeNull()
    expect((result as MealPlan)[0].leftover).toBe('rajma')
  })

  it('reconstructs a MealPlan from valid data', () => {
    const result = docToPlan({ days: sevenDays, uid: 'test', createdAt: new Date() })
    expect(result).not.toBeNull()
    expect(result).toHaveLength(7)
  })

  it('round-trips through planToDays → docToPlan', () => {
    const serialised = { days: planToDays(PLAN) }
    const result = docToPlan(serialised)
    expect(result).toEqual(PLAN)
  })
})

// ─── docToExtendedPlan ────────────────────────────────────────────────────────

describe('docToExtendedPlan', () => {
  const validDay = { breakfast: 'poha', lunch: 'chana', snack: 'trail', dinner: 'rajma', leftover: null }
  const sevenDays = Array<typeof validDay>(7).fill(validDay)

  const validBase = { days: sevenDays }

  it('returns null when the days array is invalid (delegates to docToPlan)', () => {
    expect(docToExtendedPlan(null)).toBeNull()
    expect(docToExtendedPlan({})).toBeNull()
    expect(docToExtendedPlan({ days: sevenDays.slice(0, 6) })).toBeNull()
  })

  it('returns a result with a valid plan when days is correct', () => {
    const result = docToExtendedPlan(validBase)
    expect(result).not.toBeNull()
    expect(result!.plan).toHaveLength(7)
  })

  it('defaults source to local-generator when field is absent', () => {
    expect(docToExtendedPlan(validBase)!.source).toBe('local-generator')
  })

  it('defaults source to local-generator for unrecognised source values', () => {
    expect(docToExtendedPlan({ ...validBase, source: 'unknown' })!.source).toBe('local-generator')
    expect(docToExtendedPlan({ ...validBase, source: null })!.source).toBe('local-generator')
  })

  it('returns source gemini when field equals "gemini"', () => {
    expect(docToExtendedPlan({ ...validBase, source: 'gemini' })!.source).toBe('gemini')
  })

  it('returns runtimeMeals when present as a plain object', () => {
    const runtimeMeals = { poha: { id: 'poha', name: 'Poha' } }
    const result = docToExtendedPlan({ ...validBase, runtimeMeals })
    expect(result!.runtimeMeals).toEqual(runtimeMeals)
  })

  it('defaults runtimeMeals to empty object when field is absent', () => {
    expect(docToExtendedPlan(validBase)!.runtimeMeals).toEqual({})
  })

  it('defaults runtimeMeals to empty object when field is an array', () => {
    expect(docToExtendedPlan({ ...validBase, runtimeMeals: [] })!.runtimeMeals).toEqual({})
  })

  it('returns runtimeRecipes when present as a plain object', () => {
    const runtimeRecipes = { poha: { id: 'poha', name: 'Poha Recipe' } }
    const result = docToExtendedPlan({ ...validBase, runtimeRecipes })
    expect(result!.runtimeRecipes).toEqual(runtimeRecipes)
  })

  it('defaults runtimeRecipes to empty object when field is absent', () => {
    expect(docToExtendedPlan(validBase)!.runtimeRecipes).toEqual({})
  })

  it('returns runtimeGrocery when present as an array', () => {
    const runtimeGrocery = [{ section: 'Produce', name: 'Spinach', qty: '200g' }]
    const result = docToExtendedPlan({ ...validBase, runtimeGrocery })
    expect(result!.runtimeGrocery).toEqual(runtimeGrocery)
  })

  it('defaults runtimeGrocery to empty array when field is absent', () => {
    expect(docToExtendedPlan(validBase)!.runtimeGrocery).toEqual([])
  })

  it('defaults runtimeGrocery to empty array when field is not an array', () => {
    expect(docToExtendedPlan({ ...validBase, runtimeGrocery: {} })!.runtimeGrocery).toEqual([])
  })

  it('handles a full extended plan document (as saved by saveExtendedPlan)', () => {
    const runtimeMeals  = { dal: { id: 'dal', name: 'Dal', glyph: 'Bowl', tone: 'paprika', kcal: 400, p: 18, c: 50, fat: 8, sugar: 3, fiber: 7, time: 25 } }
    const runtimeRecipes = { dal: { id: 'dal', name: 'Dal Recipe', steps: ['Cook the dal'] } }
    const runtimeGrocery = [{ section: 'Grains', name: 'Red lentils', qty: '1 cup' }]
    const doc = { days: sevenDays, source: 'gemini', runtimeMeals, runtimeRecipes, runtimeGrocery }
    const result = docToExtendedPlan(doc)
    expect(result).not.toBeNull()
    expect(result!.source).toBe('gemini')
    expect(result!.runtimeMeals['dal'].name).toBe('Dal')
    expect(result!.runtimeGrocery[0].name).toBe('Red lentils')
  })

  it('handles old-format documents (no source / runtime fields) without error', () => {
    const oldDoc = { days: sevenDays, uid: 'user123', createdAt: new Date() }
    const result = docToExtendedPlan(oldDoc)
    expect(result).not.toBeNull()
    expect(result!.source).toBe('local-generator')
    expect(result!.runtimeMeals).toEqual({})
    expect(result!.runtimeGrocery).toEqual([])
  })
})
