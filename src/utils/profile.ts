import type { OnboardingState, UserProfile, CuisineId, EmphasisId, FitnessGoal } from '../types/profile'

// ─── Label maps ───────────────────────────────────────────────────────────────

const CUISINE_LABELS: Record<CuisineId, string> = {
  north_indian:  'North Indian',
  south_indian:  'South Indian',
  gujarati:      'Gujarati',
  bengali:       'Bengali',
  mediterranean: 'Mediterranean',
  thai:          'Thai',
  mexican:       'Mexican',
  japanese:      'Japanese',
}

const EMPHASIS_LABELS: Record<EmphasisId, string> = {
  high_protein: 'High protein',
  low_sugar:    'Low sugar',
  low_carb:     'Lower carb',
  weight_loss:  'Weight loss',
  muscle:       'Build muscle',
  gut:          'Gut friendly',
}

// ─── Pure helpers (exported for testing) ─────────────────────────────────────

export function householdLabel(n: number): string {
  if (n === 1) return 'You'
  if (n === 2) return 'You & your partner'
  return `Family of ${n}`
}

/**
 * Derives a daily protein target from calories and preferences.
 * High-protein emphasis or muscle/performance goal → 30 % of kcal from protein.
 * Otherwise 20 %.  Protein has 4 kcal/g.
 */
export function deriveGoalProtein(
  goalKcal: number,
  emphasis: EmphasisId[],
  fitness?: FitnessGoal,
): number {
  const high =
    emphasis.includes('high_protein') ||
    fitness === 'muscle' ||
    fitness === 'performance'
  return Math.round((goalKcal * (high ? 0.30 : 0.20)) / 4)
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildProfile(s: OnboardingState): UserProfile {
  return {
    household:   householdLabel(s.household),
    servings:    s.household,
    goalKcal:    s.goalKcal,
    goalProtein: deriveGoalProtein(s.goalKcal, s.emphasis, s.fitness),
    diet:        s.diet,
    cuisines:    s.cuisines.map((id) => CUISINE_LABELS[id] ?? id),
    emphasis:    s.emphasis.map((id) => EMPHASIS_LABELS[id] ?? id),
  }
}
