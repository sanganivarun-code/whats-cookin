// Tests for the pure validateGeminiPlan function in geminiClient.ts.
// callGenerateMealPlan is not tested here — it wraps httpsCallable and
// requires Firebase mocking that belongs in an integration test.

import { validateGeminiPlan } from '../../lib/geminiClient'
import type { GeminiPlanResponse } from '../../lib/geminiClient'
import type { Meal } from '../../types/meal'

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function makeDay(
  breakfast = 'meal_a',
  lunch     = 'meal_b',
  snack     = 'meal_c',
  dinner    = 'meal_d',
  leftover: string | null = null,
) {
  return { breakfast, lunch, snack, dinner, leftover }
}

function makeMeal(id: string): Meal {
  return {
    id, name: 'Test Meal',
    glyph: 'Bowl', tone: 'paprika',
    kcal: 400, p: 20, c: 50, fat: 10, sugar: 5, fiber: 4, time: 20,
  }
}

// Returns a minimal valid payload — all 7 days reference the same four meals.
function minimal(): GeminiPlanResponse {
  return {
    days: Array.from({ length: 7 }, () => makeDay()),
    meals: {
      meal_a: makeMeal('meal_a'),
      meal_b: makeMeal('meal_b'),
      meal_c: makeMeal('meal_c'),
      meal_d: makeMeal('meal_d'),
    },
    recipes: {},
    groceryItems: [{ section: 'Produce', name: 'Spinach', qty: '200g' }],
  }
}

// ─── Null / non-object inputs ──────────────────────────────────────────────────

describe('validateGeminiPlan – bad input', () => {
  it('returns null for null', () => {
    expect(validateGeminiPlan(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(validateGeminiPlan(undefined)).toBeNull()
  })

  it('returns null for a string', () => {
    expect(validateGeminiPlan('{"days":[]}')).toBeNull()
  })

  it('returns null for a number', () => {
    expect(validateGeminiPlan(42)).toBeNull()
  })

  it('returns null for an empty object', () => {
    expect(validateGeminiPlan({})).toBeNull()
  })
})

// ─── days validation ───────────────────────────────────────────────────────────

describe('validateGeminiPlan – days', () => {
  it('returns null when days is missing', () => {
    const { days: _days, ...rest } = minimal()
    expect(validateGeminiPlan(rest)).toBeNull()
  })

  it('returns null when days is not an array', () => {
    expect(validateGeminiPlan({ ...minimal(), days: 'seven' })).toBeNull()
  })

  it('returns null when days has fewer than 7 entries', () => {
    const bad = { ...minimal(), days: minimal().days.slice(0, 6) }
    expect(validateGeminiPlan(bad)).toBeNull()
  })

  it('returns null when days has more than 7 entries', () => {
    const bad = { ...minimal(), days: [...minimal().days, makeDay()] }
    expect(validateGeminiPlan(bad)).toBeNull()
  })

  it('returns null when a day is null', () => {
    const bad = { ...minimal(), days: [...minimal().days.slice(0, 6), null] }
    expect(validateGeminiPlan(bad)).toBeNull()
  })

  it('returns null when a slot is missing from a day', () => {
    const days = minimal().days.map((d, i) =>
      i === 3 ? { breakfast: d.breakfast, lunch: d.lunch, snack: d.snack, leftover: null } : d
    )
    expect(validateGeminiPlan({ ...minimal(), days })).toBeNull()
  })

  it('returns null when a slot is an empty string', () => {
    const days = minimal().days.map((d, i) => i === 0 ? { ...d, breakfast: '' } : d)
    expect(validateGeminiPlan({ ...minimal(), days })).toBeNull()
  })

  it('returns null when leftover is a number instead of string or null', () => {
    const days = minimal().days.map((d, i) => i === 1 ? { ...d, leftover: 99 } : d)
    expect(validateGeminiPlan({ ...minimal(), days })).toBeNull()
  })

  it('accepts leftover as null', () => {
    expect(validateGeminiPlan(minimal())).not.toBeNull()
  })

  it('accepts leftover as a valid meal ID string', () => {
    const days = minimal().days.map((d, i) =>
      i === 1 ? { ...d, leftover: 'meal_d' } : d
    )
    expect(validateGeminiPlan({ ...minimal(), days })).not.toBeNull()
  })
})

// ─── meals validation ──────────────────────────────────────────────────────────

describe('validateGeminiPlan – meals', () => {
  it('returns null when meals is missing', () => {
    const { meals: _meals, ...rest } = minimal()
    expect(validateGeminiPlan(rest)).toBeNull()
  })

  it('returns null when meals is not an object', () => {
    expect(validateGeminiPlan({ ...minimal(), meals: [] })).toBeNull()
  })

  it('returns null when a referenced meal ID is absent from meals', () => {
    const { meal_b: _mb, ...partialMeals } = minimal().meals
    expect(validateGeminiPlan({ ...minimal(), meals: partialMeals })).toBeNull()
  })

  it('returns null when a meal is missing the name field', () => {
    const meals = { ...minimal().meals, meal_a: { ...makeMeal('meal_a'), name: '' } }
    expect(validateGeminiPlan({ ...minimal(), meals })).toBeNull()
  })

  it('returns null when a numeric field is missing', () => {
    const { kcal: _k, ...noKcal } = makeMeal('meal_a')
    expect(validateGeminiPlan({ ...minimal(), meals: { ...minimal().meals, meal_a: noKcal } })).toBeNull()
  })

  it('returns null when a numeric field is NaN', () => {
    const meals = { ...minimal().meals, meal_a: { ...makeMeal('meal_a'), kcal: NaN } }
    expect(validateGeminiPlan({ ...minimal(), meals })).toBeNull()
  })

  it('returns null when a numeric field is Infinity', () => {
    const meals = { ...minimal().meals, meal_a: { ...makeMeal('meal_a'), p: Infinity } }
    expect(validateGeminiPlan({ ...minimal(), meals })).toBeNull()
  })

  it('returns null when glyph is not a valid GlyphKind', () => {
    const meals = { ...minimal().meals, meal_a: { ...makeMeal('meal_a'), glyph: 'Spoon' } }
    expect(validateGeminiPlan({ ...minimal(), meals })).toBeNull()
  })

  it('returns null when tone is not a valid ColorTone', () => {
    const meals = { ...minimal().meals, meal_a: { ...makeMeal('meal_a'), tone: 'red' } }
    expect(validateGeminiPlan({ ...minimal(), meals })).toBeNull()
  })

  it('accepts all valid glyph values', () => {
    const glyphs = ['Bowl', 'Roti', 'Glass', 'Leaf', 'Stack', 'Dome', 'Pot', 'Rice', 'Cube'] as const
    for (const glyph of glyphs) {
      const meals = { ...minimal().meals, meal_a: { ...makeMeal('meal_a'), glyph } }
      expect(validateGeminiPlan({ ...minimal(), meals })).not.toBeNull()
    }
  })

  it('accepts all valid tone values', () => {
    const tones = ['paprika', 'saffron', 'olive', 'ink'] as const
    for (const tone of tones) {
      const meals = { ...minimal().meals, meal_a: { ...makeMeal('meal_a'), tone } }
      expect(validateGeminiPlan({ ...minimal(), meals })).not.toBeNull()
    }
  })

  it('validates a leftover meal ID in meals too', () => {
    // day 1 sets leftover = 'meal_d' — it must be present in meals
    const days = minimal().days.map((d, i) =>
      i === 1 ? { ...d, leftover: 'meal_d' } : d
    )
    expect(validateGeminiPlan({ ...minimal(), days })).not.toBeNull()
  })

  it('returns null when the leftover meal ID is absent from meals', () => {
    const days = minimal().days.map((d, i) =>
      i === 1 ? { ...d, leftover: 'unknown_meal' } : d
    )
    expect(validateGeminiPlan({ ...minimal(), days })).toBeNull()
  })
})

// ─── recipes + groceryItems validation ────────────────────────────────────────

describe('validateGeminiPlan – recipes and groceryItems', () => {
  it('returns null when recipes is missing', () => {
    const { recipes: _r, ...rest } = minimal()
    expect(validateGeminiPlan(rest)).toBeNull()
  })

  it('accepts an empty recipes object', () => {
    expect(validateGeminiPlan({ ...minimal(), recipes: {} })).not.toBeNull()
  })

  it('accepts a non-empty recipes object without deep validation', () => {
    const recipes = { meal_a: { id: 'meal_a', name: 'Test', steps: ['Cook it'] } }
    expect(validateGeminiPlan({ ...minimal(), recipes })).not.toBeNull()
  })

  it('returns null when groceryItems is missing', () => {
    const { groceryItems: _g, ...rest } = minimal()
    expect(validateGeminiPlan(rest)).toBeNull()
  })

  it('accepts an empty groceryItems array', () => {
    expect(validateGeminiPlan({ ...minimal(), groceryItems: [] })).not.toBeNull()
  })

  it('returns null when a grocery item is missing the section field', () => {
    const groceryItems = [{ name: 'Spinach', qty: '200g' }]
    expect(validateGeminiPlan({ ...minimal(), groceryItems })).toBeNull()
  })

  it('returns null when a grocery item is missing the qty field', () => {
    const groceryItems = [{ section: 'Produce', name: 'Spinach' }]
    expect(validateGeminiPlan({ ...minimal(), groceryItems })).toBeNull()
  })
})

// ─── Happy path ────────────────────────────────────────────────────────────────

describe('validateGeminiPlan – happy path', () => {
  it('returns the original object reference for a valid minimal payload', () => {
    const payload = minimal()
    expect(validateGeminiPlan(payload)).toBe(payload)
  })

  it('returns a typed response with all fields intact', () => {
    const result = validateGeminiPlan(minimal())
    expect(result).not.toBeNull()
    expect(result!.days).toHaveLength(7)
    expect(result!.meals['meal_a'].name).toBe('Test Meal')
    expect(result!.groceryItems[0].section).toBe('Produce')
  })

  it('handles a realistic payload with a leftover on day 1', () => {
    const days = [
      makeDay('oats',  'dal_rice', 'trail', 'rajma',    null),
      makeDay('toast', 'dal_rice', 'fruit', 'chana',    'rajma'),
      makeDay('oats',  'chana',    'trail', 'khichdi',  null),
      makeDay('toast', 'khichdi',  'fruit', 'rajma',    null),
      makeDay('oats',  'dal_rice', 'trail', 'chana',    null),
      makeDay('toast', 'chana',    'fruit', 'khichdi',  null),
      makeDay('oats',  'khichdi',  'trail', 'dal_rice', null),
    ]
    const ids = ['oats', 'dal_rice', 'trail', 'rajma', 'toast', 'fruit', 'chana', 'khichdi']
    const meals = Object.fromEntries(ids.map(id => [id, makeMeal(id)]))
    const payload = { days, meals, recipes: {}, groceryItems: [] }
    expect(validateGeminiPlan(payload)).not.toBeNull()
  })
})
