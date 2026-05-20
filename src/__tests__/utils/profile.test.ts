import { buildProfile, householdLabel, deriveGoalProtein } from '../../utils/profile'
import type { OnboardingState } from '../../types/profile'

// ─── householdLabel ───────────────────────────────────────────────────────────

describe('householdLabel', () => {
  it('returns "You" for 1', () => {
    expect(householdLabel(1)).toBe('You')
  })

  it('returns "You & your partner" for 2', () => {
    expect(householdLabel(2)).toBe('You & your partner')
  })

  it('returns "Family of N" for 3+', () => {
    expect(householdLabel(3)).toBe('Family of 3')
    expect(householdLabel(5)).toBe('Family of 5')
  })
})

// ─── deriveGoalProtein ────────────────────────────────────────────────────────

describe('deriveGoalProtein', () => {
  it('uses 20% of kcal when no emphasis', () => {
    // 1900 * 0.20 / 4 = 95
    expect(deriveGoalProtein(1900, [])).toBe(95)
  })

  it('uses 30% of kcal with high_protein emphasis', () => {
    // 1900 * 0.30 / 4 = 142.5 → rounds to 143
    expect(deriveGoalProtein(1900, ['high_protein'])).toBe(143)
  })

  it('uses 30% of kcal with muscle fitness goal', () => {
    expect(deriveGoalProtein(2000, [], 'muscle')).toBe(150)
  })

  it('uses 30% of kcal with performance fitness goal', () => {
    expect(deriveGoalProtein(2000, [], 'performance')).toBe(150)
  })

  it('uses 20% for lose/maintain goals without high_protein emphasis', () => {
    expect(deriveGoalProtein(2000, [], 'lose')).toBe(100)
    expect(deriveGoalProtein(2000, [], 'maintain')).toBe(100)
  })

  it('high_protein emphasis overrides a maintain goal', () => {
    expect(deriveGoalProtein(2000, ['high_protein'], 'maintain')).toBe(150)
  })
})

// ─── buildProfile ─────────────────────────────────────────────────────────────

const base: OnboardingState = {
  diet:      'Vegetarian',
  cuisines:  ['north_indian', 'south_indian'],
  emphasis:  ['high_protein', 'low_sugar'],
  household: 2,
  goalKcal:  1900,
  cookTime:  30,
  batch:     3,
  allergies: 'Peanuts',
  fitness:   'lose',
}

describe('buildProfile', () => {
  it('sets household label from household count', () => {
    expect(buildProfile(base).household).toBe('You & your partner')
    expect(buildProfile({ ...base, household: 1 }).household).toBe('You')
    expect(buildProfile({ ...base, household: 4 }).household).toBe('Family of 4')
  })

  it('passes through goalKcal and servings', () => {
    const p = buildProfile(base)
    expect(p.goalKcal).toBe(1900)
    expect(p.servings).toBe(2)
  })

  it('derives goalProtein from kcal and emphasis', () => {
    // high_protein → 30% → 1900*0.3/4 = 142.5 → 143
    expect(buildProfile(base).goalProtein).toBe(143)
  })

  it('passes through diet', () => {
    expect(buildProfile(base).diet).toBe('Vegetarian')
  })

  it('maps cuisine IDs to display labels', () => {
    const p = buildProfile(base)
    expect(p.cuisines).toEqual(['North Indian', 'South Indian'])
  })

  it('maps emphasis IDs to display labels', () => {
    const p = buildProfile(base)
    expect(p.emphasis).toEqual(['High protein', 'Low sugar'])
  })

  it('falls back to raw ID for unknown cuisine or emphasis', () => {
    const s = { ...base, cuisines: ['north_indian', 'unknown_cuisine'] as OnboardingState['cuisines'] }
    const p = buildProfile(s)
    expect(p.cuisines[1]).toBe('unknown_cuisine')
  })

  it('handles empty cuisines and emphasis', () => {
    const p = buildProfile({ ...base, cuisines: [], emphasis: [] })
    expect(p.cuisines).toEqual([])
    expect(p.emphasis).toEqual([])
  })

  it('uses 20% protein target when no high-protein signals', () => {
    const p = buildProfile({ ...base, emphasis: [], fitness: 'maintain' })
    // 1900 * 0.20 / 4 = 95
    expect(p.goalProtein).toBe(95)
  })
})
