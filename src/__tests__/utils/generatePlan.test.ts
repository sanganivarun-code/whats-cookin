import { generatePlan } from '../../utils/generatePlan'
import { MEALS } from '../../data/meals'
import type { OnboardingState } from '../../types/profile'

// Shared base state used as a starting point for all tests.
// Covers the common case: Vegetarian, two cuisines, one emphasis, mid-range
// calorie goal, generous cook time, and moderate batch cooking.
const base: OnboardingState = {
  diet:      'Vegetarian',
  cuisines:  ['north_indian', 'south_indian'],
  emphasis:  ['high_protein'],
  household: 2,
  goalKcal:  1900,
  cookTime:  45,
  batch:     2,
  allergies: '',
}

// ─── Output shape ─────────────────────────────────────────────────────────────

describe('generatePlan – output shape', () => {
  const plan = generatePlan(base)

  it('returns exactly 7 days', () => {
    expect(plan).toHaveLength(7)
  })

  it('fills all four slots on every day with valid meal IDs', () => {
    for (const day of plan) {
      expect(MEALS[day.breakfast]).toBeDefined()
      expect(MEALS[day.lunch]).toBeDefined()
      expect(MEALS[day.snack]).toBeDefined()
      expect(MEALS[day.dinner]).toBeDefined()
    }
  })

  it('leftover is null or a valid meal ID', () => {
    for (const day of plan) {
      if (day.leftover !== null) {
        expect(MEALS[day.leftover]).toBeDefined()
      }
    }
  })
})

// ─── Batch leftovers ──────────────────────────────────────────────────────────

describe('generatePlan – batch leftovers', () => {
  it('day 0 never has a leftover regardless of batch setting', () => {
    const plan = generatePlan({ ...base, batch: 7 })
    expect(plan[0].leftover).toBeNull()
  })

  it('sets leftover to the previous day dinner for each batch day', () => {
    const plan = generatePlan({ ...base, batch: 3 })
    expect(plan[1].leftover).toBe(plan[0].dinner)
    expect(plan[2].leftover).toBe(plan[1].dinner)
    expect(plan[3].leftover).toBe(plan[2].dinner)
  })

  it('days beyond batch count have null leftover', () => {
    const plan = generatePlan({ ...base, batch: 3 })
    expect(plan[4].leftover).toBeNull()
    expect(plan[5].leftover).toBeNull()
    expect(plan[6].leftover).toBeNull()
  })

  it('caps at 6 leftover days even when batch exceeds 6', () => {
    const plan = generatePlan({ ...base, batch: 10 })
    for (let i = 1; i <= 6; i++) {
      expect(plan[i].leftover).not.toBeNull()
    }
  })

  it('no leftovers when batch is 0', () => {
    const plan = generatePlan({ ...base, batch: 0 })
    for (const day of plan) {
      expect(day.leftover).toBeNull()
    }
  })
})

// ─── Dietary filter ───────────────────────────────────────────────────────────

describe('generatePlan – dietary filter', () => {
  // Meals marked vegan: false in MEAL_META (contain dairy or eggs)
  const NON_VEGAN = new Set([
    'paneer_bhurji', 'palak_paneer', 'curd_rice',
    'thepla', 'smoothie', 'fruit', 'buttermilk',
  ])

  it('excludes non-vegan meals from all slots when diet is Vegan', () => {
    const plan = generatePlan({ ...base, diet: 'Vegan' })
    for (const day of plan) {
      expect(NON_VEGAN.has(day.breakfast)).toBe(false)
      expect(NON_VEGAN.has(day.lunch)).toBe(false)
      expect(NON_VEGAN.has(day.snack)).toBe(false)
      expect(NON_VEGAN.has(day.dinner)).toBe(false)
    }
  })

  it('produces a valid plan for Vegetarian diet', () => {
    const plan = generatePlan({ ...base, diet: 'Vegetarian' })
    expect(plan).toHaveLength(7)
    for (const day of plan) {
      expect(MEALS[day.breakfast]).toBeDefined()
      expect(MEALS[day.dinner]).toBeDefined()
    }
  })
})

// ─── Cook-time preference ─────────────────────────────────────────────────────

describe('generatePlan – cook-time preference', () => {
  it('selects the top-ranked within-time meal first when cookTime is tight', () => {
    // With cookTime=15 and north+south Indian cuisine + high protein:
    // poha (15 min, matches both cuisines) scores highest among breakfast options.
    // Meals exceeding 15 min (idli, besan_chilla, pesarattu, etc.) receive a
    // -30 cook-time penalty that drops them below poha's score.
    const plan = generatePlan({ ...base, cookTime: 15 })
    expect(plan[0].breakfast).toBe('poha')
  })
})

// ─── Graceful fallback ────────────────────────────────────────────────────────

describe('generatePlan – graceful fallback', () => {
  it('produces a complete plan even when allergies eliminate most meals', () => {
    // Extremely broad allergy list that would block almost every meal if applied
    // strictly; the generator should relax the filter rather than fail.
    const plan = generatePlan({
      ...base,
      allergies: 'peanut, paneer, tofu, soy, dal, moong, chana, chickpea, rava, sprout, curd, yogurt, almond',
    })
    expect(plan).toHaveLength(7)
    for (const day of plan) {
      expect(MEALS[day.breakfast]).toBeDefined()
      expect(MEALS[day.lunch]).toBeDefined()
      expect(MEALS[day.snack]).toBeDefined()
      expect(MEALS[day.dinner]).toBeDefined()
    }
  })
})

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('generatePlan – determinism', () => {
  it('returns identical plans for identical inputs', () => {
    const a = generatePlan(base)
    const b = generatePlan(base)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('produces different plans for different nutrition emphasis', () => {
    // high_protein boosts protein-dense meals; low_sugar penalises sugary ones.
    // The two scoring profiles should select different top dinners on day 0.
    const highProtein = generatePlan({ ...base, emphasis: ['high_protein'] })
    const lowSugar    = generatePlan({ ...base, emphasis: ['low_sugar']    })
    expect(JSON.stringify(highProtein)).not.toBe(JSON.stringify(lowSugar))
  })
})
