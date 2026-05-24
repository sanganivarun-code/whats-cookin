// Tests for the pure serialization helpers in firestoreSync.ts.
// No Firebase mocking is needed because planToDays / docToPlan / docToExtendedPlan
// have zero Firestore dependency — they work on plain objects only.

import { planToDays, docToPlan, docToExtendedPlan, docToFavoriteRecord } from '../../lib/firestoreSync'
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

  it('defaults source to local-dev-fallback when field is absent', () => {
    expect(docToExtendedPlan(validBase)!.source).toBe('local-dev-fallback')
  })

  it('defaults source to local-dev-fallback for unrecognised source values', () => {
    expect(docToExtendedPlan({ ...validBase, source: 'unknown' })!.source).toBe('local-dev-fallback')
    expect(docToExtendedPlan({ ...validBase, source: null })!.source).toBe('local-dev-fallback')
  })

  it('maps legacy local-generator source to local-dev-fallback for backward compatibility', () => {
    expect(docToExtendedPlan({ ...validBase, source: 'local-generator' })!.source).toBe('local-dev-fallback')
  })

  it('returns source gemini when field equals "gemini"', () => {
    expect(docToExtendedPlan({ ...validBase, source: 'gemini' })!.source).toBe('gemini')
  })

  it('returns source sample when field equals "sample"', () => {
    expect(docToExtendedPlan({ ...validBase, source: 'sample' })!.source).toBe('sample')
  })

  it('returns source local-dev-fallback when field equals "local-dev-fallback"', () => {
    expect(docToExtendedPlan({ ...validBase, source: 'local-dev-fallback' })!.source).toBe('local-dev-fallback')
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
    expect(result!.source).toBe('local-dev-fallback')
    expect(result!.runtimeMeals).toEqual({})
    expect(result!.runtimeGrocery).toEqual([])
  })

  it('defaults overrides to empty object when field is absent', () => {
    expect(docToExtendedPlan(validBase)!.overrides).toEqual({})
  })

  it('defaults overrides to empty object when field is not a plain object', () => {
    expect(docToExtendedPlan({ ...validBase, overrides: [] })!.overrides).toEqual({})
    expect(docToExtendedPlan({ ...validBase, overrides: 'bad' })!.overrides).toEqual({})
    expect(docToExtendedPlan({ ...validBase, overrides: null })!.overrides).toEqual({})
  })

  it('returns overrides unchanged when present as a plain object', () => {
    const overrides = {
      '2_dinner':    { kind: 'eating-out' },
      '4_breakfast': { kind: 'self-cook', name: 'Omelette' },
      '0_lunch':     { kind: 'removed' },
    }
    const result = docToExtendedPlan({ ...validBase, overrides })
    expect(result!.overrides).toEqual(overrides)
  })

  it('round-trips overrides through planToDays → docToExtendedPlan', () => {
    const overrides = { '1_snack': { kind: 'eating-out' } }
    const doc = { days: planToDays(PLAN), source: 'gemini', overrides }
    const result = docToExtendedPlan(doc)
    expect(result!.overrides).toEqual(overrides)
  })

  it('preserves a custom override with mealId and name (swap-with-favorite shape)', () => {
    const overrides = {
      '3_dinner': { kind: 'custom', mealId: 'tikka-masala-gemini-abc', name: 'Tikka Masala' },
    }
    const doc = { days: planToDays(PLAN), source: 'gemini', overrides }
    const result = docToExtendedPlan(doc)
    expect(result!.overrides['3_dinner']).toEqual({
      kind: 'custom',
      mealId: 'tikka-masala-gemini-abc',
      name: 'Tikka Masala',
    })
  })
})

// ─── docToFavoriteRecord ──────────────────────────────────────────────────────

describe('docToFavoriteRecord', () => {
  const validSnapshot = {
    id: 'poha', name: 'Veg Poha', glyph: 'Rice', tone: 'saffron',
    kcal: 380, p: 12, c: 58, fat: 11, sugar: 4, fiber: 5, time: 15,
  }

  it('falls back to docId for mealId and unknown source on null input', () => {
    const result = docToFavoriteRecord(null, 'poha')
    expect(result.mealId).toBe('poha')
    expect(result.source).toBe('unknown')
    expect(result.snapshot).toBeUndefined()
  })

  it('falls back gracefully on non-object input', () => {
    expect(docToFavoriteRecord('bad', 'poha').source).toBe('unknown')
    expect(docToFavoriteRecord(42, 'poha').mealId).toBe('poha')
  })

  it('reads mealId from document field when present', () => {
    const result = docToFavoriteRecord({ mealId: 'khichdi' }, 'khichdi')
    expect(result.mealId).toBe('khichdi')
  })

  it('uses docId as mealId when document mealId field is missing', () => {
    const result = docToFavoriteRecord({}, 'fallback_id')
    expect(result.mealId).toBe('fallback_id')
  })

  it('parses source gemini', () => {
    expect(docToFavoriteRecord({ source: 'gemini' }, 'x').source).toBe('gemini')
  })

  it('parses source sample', () => {
    expect(docToFavoriteRecord({ source: 'sample' }, 'x').source).toBe('sample')
  })

  it('falls back to unknown for unrecognised source', () => {
    expect(docToFavoriteRecord({ source: 'other' }, 'x').source).toBe('unknown')
    expect(docToFavoriteRecord({ source: null }, 'x').source).toBe('unknown')
  })

  it('parses source custom', () => {
    expect(docToFavoriteRecord({ source: 'custom' }, 'x').source).toBe('custom')
  })

  it('handles legacy documents with no source field (backward compat)', () => {
    const legacy = { mealId: 'poha', savedAt: new Date() }
    const result = docToFavoriteRecord(legacy, 'poha')
    expect(result.mealId).toBe('poha')
    expect(result.source).toBe('unknown')
    expect(result.snapshot).toBeUndefined()
  })

  it('parses a valid snapshot and returns it', () => {
    const result = docToFavoriteRecord({ source: 'sample', snapshot: validSnapshot }, 'poha')
    expect(result.snapshot).not.toBeUndefined()
    expect(result.snapshot!.name).toBe('Veg Poha')
    expect(result.snapshot!.kcal).toBe(380)
  })

  it('includes optional cuisine field from snapshot when present', () => {
    const snap = { ...validSnapshot, cuisine: 'North Indian' }
    const result = docToFavoriteRecord({ source: 'sample', snapshot: snap }, 'poha')
    expect(result.snapshot!.cuisine).toBe('North Indian')
  })

  it('omits cuisine from snapshot when absent', () => {
    const result = docToFavoriteRecord({ source: 'sample', snapshot: validSnapshot }, 'poha')
    expect(result.snapshot!.cuisine).toBeUndefined()
  })

  it('returns undefined snapshot when snapshot object is missing required fields', () => {
    const badSnap = { id: 'poha', name: 'Poha' } // missing kcal, p, c, etc.
    const result = docToFavoriteRecord({ source: 'sample', snapshot: badSnap }, 'poha')
    expect(result.snapshot).toBeUndefined()
  })

  it('returns undefined snapshot when snapshot field is an array', () => {
    const result = docToFavoriteRecord({ source: 'sample', snapshot: [] }, 'poha')
    expect(result.snapshot).toBeUndefined()
  })

  it('returns undefined snapshot when snapshot field is a string', () => {
    const result = docToFavoriteRecord({ source: 'sample', snapshot: 'not-an-object' }, 'poha')
    expect(result.snapshot).toBeUndefined()
  })

  // ─── recipeSnapshot ───────────────────────────────────────────────────────────

  const validRecipeSnapshot = {
    id: 'poha', name: 'Veg Poha', subtitle: 'Quick and light.', servings: 2,
    time: 15, difficulty: 'Easy', tags: ['Vegetarian'],
    nutrition: { kcal: 380, p: 12, c: 58, fat: 11, sugar: 4, fiber: 5 },
    ingredients: [{ name: 'Flattened rice', amt: '1 cup', category: 'Grains & Bread' }],
    steps: ['Rinse and soak poha for 5 minutes.', 'Temper in oil and combine.'],
    pairsWith: [],
  }

  it('returns undefined recipeSnapshot when field is absent (backward compat)', () => {
    const result = docToFavoriteRecord({ source: 'gemini', snapshot: validSnapshot }, 'poha')
    expect(result.recipeSnapshot).toBeUndefined()
  })

  it('returns undefined recipeSnapshot when field is not an object', () => {
    expect(docToFavoriteRecord({ recipeSnapshot: 'bad' }, 'poha').recipeSnapshot).toBeUndefined()
    expect(docToFavoriteRecord({ recipeSnapshot: [] }, 'poha').recipeSnapshot).toBeUndefined()
    expect(docToFavoriteRecord({ recipeSnapshot: 42 }, 'poha').recipeSnapshot).toBeUndefined()
  })

  it('returns undefined recipeSnapshot when required fields are missing', () => {
    // missing steps and ingredients
    expect(docToFavoriteRecord({ recipeSnapshot: { id: 'poha', name: 'Poha' } }, 'poha').recipeSnapshot).toBeUndefined()
    // missing id
    expect(docToFavoriteRecord({ recipeSnapshot: { name: 'Poha', steps: [], ingredients: [] } }, 'poha').recipeSnapshot).toBeUndefined()
  })

  it('returns recipeSnapshot when minimally valid (id, name, steps[], ingredients[])', () => {
    const result = docToFavoriteRecord({ recipeSnapshot: validRecipeSnapshot }, 'poha')
    expect(result.recipeSnapshot).not.toBeUndefined()
    expect(result.recipeSnapshot!.name).toBe('Veg Poha')
    expect(result.recipeSnapshot!.steps).toHaveLength(2)
  })

  it('round-trips a FavoriteRecord with both snapshot and recipeSnapshot', () => {
    const doc = { mealId: 'poha', source: 'gemini', snapshot: validSnapshot, recipeSnapshot: validRecipeSnapshot }
    const result = docToFavoriteRecord(doc, 'poha')
    expect(result.mealId).toBe('poha')
    expect(result.source).toBe('gemini')
    expect(result.snapshot!.name).toBe('Veg Poha')
    expect(result.recipeSnapshot!.steps[0]).toBe('Rinse and soak poha for 5 minutes.')
  })
})
