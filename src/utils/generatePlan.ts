// Local deterministic meal-plan generator.
// Selects from the static MEALS pool using onboarding preferences as filters
// and scoring weights. Output is always the same for the same input so tests
// are stable and the Loading screen can re-render without flicker.
//
// FUTURE: replace the body of `generatePlan` with a Gemini API call.
// `OnboardingState` is already the exact prompt payload shape.
// Keep this file as the single integration point — no callers need to change.

import type { MealPlan, MealSlot, Meal } from '../types/meal'
import type { OnboardingState, CuisineId, EmphasisId, FitnessGoal } from '../types/profile'
import { MEALS } from '../data/meals'

// ─── Meal metadata ─────────────────────────────────────────────────────────────
// Augments the meal library with slot suitability, cuisine tags, and allergy
// keywords. Kept here (not in types/meal.ts) because it is generator-only data;
// the Meal type itself stays display-neutral.

interface MealMeta {
  slots:    MealSlot[]      // which slots this dish is appropriate for
  cuisines: CuisineId[]     // cuisine categories it belongs to
  keywords: string[]        // lowercase ingredient keywords for allergy matching
  vegan:    boolean         // false = contains dairy or eggs; excluded for Vegan diet
}

// All 20 meals in the library annotated with generator metadata.
// When a new meal is added to MEALS, add a matching entry here.
const MEAL_META: Record<string, MealMeta> = {
  poha:          { slots: ['breakfast'],          cuisines: ['north_indian', 'south_indian'],             keywords: ['peanut'],                         vegan: true  },
  besan_chilla:  { slots: ['breakfast'],          cuisines: ['north_indian', 'gujarati'],                 keywords: ['chickpea', 'besan'],               vegan: true  },
  paneer_bhurji: { slots: ['lunch', 'dinner'],    cuisines: ['north_indian'],                             keywords: ['paneer', 'dairy'],                 vegan: false },
  rajma:         { slots: ['lunch', 'dinner'],    cuisines: ['north_indian'],                             keywords: ['kidney', 'bean'],                  vegan: true  },
  chana:         { slots: ['lunch', 'dinner'],    cuisines: ['north_indian', 'mediterranean'],            keywords: ['chickpea', 'chana'],               vegan: true  },
  khichdi:       { slots: ['lunch', 'dinner'],    cuisines: ['north_indian', 'gujarati'],                 keywords: ['dal', 'moong'],                    vegan: true  },
  tofu_tikka:    { slots: ['lunch', 'dinner'],    cuisines: ['north_indian'],                             keywords: ['tofu', 'soy'],                     vegan: true  },
  palak_paneer:  { slots: ['lunch', 'dinner'],    cuisines: ['north_indian'],                             keywords: ['paneer', 'dairy'],                 vegan: false },
  sprouts:       { slots: ['lunch', 'snack'],     cuisines: ['north_indian', 'south_indian', 'gujarati'], keywords: ['sprout', 'bean'],                  vegan: true  },
  curd_rice:     { slots: ['lunch'],              cuisines: ['south_indian'],                             keywords: ['curd', 'dairy'],                   vegan: false },
  thepla:        { slots: ['breakfast'],          cuisines: ['gujarati'],                                 keywords: ['yogurt', 'dairy', 'wheat'],        vegan: false },
  idli:          { slots: ['breakfast', 'lunch'], cuisines: ['south_indian'],                             keywords: ['rice', 'lentil'],                  vegan: true  },
  upma:          { slots: ['breakfast'],          cuisines: ['south_indian'],                             keywords: ['semolina', 'rava'],                vegan: true  },
  pesarattu:     { slots: ['breakfast'],          cuisines: ['south_indian'],                             keywords: ['moong', 'ginger'],                 vegan: true  },
  soya:          { slots: ['lunch', 'dinner'],    cuisines: ['north_indian'],                             keywords: ['soy', 'soya'],                     vegan: true  },
  dal_tadka:     { slots: ['lunch', 'dinner'],    cuisines: ['north_indian', 'gujarati'],                 keywords: ['dal', 'lentil'],                   vegan: true  },
  smoothie:      { slots: ['breakfast', 'snack'], cuisines: [],                                           keywords: ['banana', 'almond', 'milk', 'dairy'],vegan: false },
  fruit:         { slots: ['snack', 'breakfast'], cuisines: [],                                           keywords: ['yogurt', 'dairy'],                 vegan: false },
  buttermilk:    { slots: ['snack'],              cuisines: ['south_indian', 'north_indian'],             keywords: ['curd', 'dairy', 'buttermilk'],     vegan: false },
  trail:         { slots: ['snack'],              cuisines: [],                                           keywords: ['chana', 'almond', 'nut'],          vegan: true  },
}

// ─── Scoring ───────────────────────────────────────────────────────────────────

interface ScoreParams {
  cuisines: CuisineId[]
  emphasis: EmphasisId[]
  fitness:  FitnessGoal | undefined
  cookTime: number
}

// Ranks a candidate meal against the user's stated preferences.
// Returns a higher number for a better match. All factors are additive so they
// can be tuned independently without affecting each other.
function scoreMeal(meta: MealMeta, meal: Meal, params: ScoreParams): number {
  let score = 100 // baseline so unpenalised meals always outrank zero

  // Cuisine affinity — the single biggest positive driver
  if (meta.cuisines.some(c => params.cuisines.includes(c))) score += 50

  // Cook-time compliance — soft penalty preserves graceful fallback
  if (meal.time > params.cookTime) score -= 30

  // Protein preference (high_protein emphasis or muscle/performance goal)
  const wantsProtein =
    params.emphasis.includes('high_protein') ||
    params.fitness === 'muscle' ||
    params.fitness === 'performance'
  if (wantsProtein) score += meal.p * 2

  if (params.emphasis.includes('low_sugar')) score -= meal.sugar * 3

  if (params.emphasis.includes('low_carb')) score -= meal.c

  // Weight-loss and lose-goal: prefer lighter meals (boost anything under 700 kcal)
  if (params.emphasis.includes('weight_loss') || params.fitness === 'lose') {
    score += Math.max(0, 700 - meal.kcal)
  }

  if (params.emphasis.includes('gut')) score += meal.fiber * 5

  return score
}

// ─── Pool building ─────────────────────────────────────────────────────────────

// Returns candidate meal IDs for a slot, with a three-level fallback so the
// generator never produces an empty pool even with very strict constraints.
function filterPool(slot: MealSlot, state: OnboardingState): string[] {
  const allIds = Object.keys(MEALS)

  // Normalise the free-text allergy string into short lowercase tokens
  const allergyTokens = state.allergies
    .toLowerCase()
    .split(/[,\s]+/)
    .map(t => t.trim())
    .filter(t => t.length > 2)

  const hasAllergy = (id: string): boolean => {
    if (!allergyTokens.length) return false
    const kw = MEAL_META[id]?.keywords ?? []
    return allergyTokens.some(a => kw.some(k => k.includes(a) || a.includes(k)))
  }

  const isDietaryOk = (id: string): boolean => {
    const meta = MEAL_META[id]
    if (!meta) return false
    // All mock meals are vegetarian; only Vegan needs special handling
    return state.diet === 'Vegan' ? meta.vegan : true
  }

  const isSlotOk = (id: string): boolean =>
    MEAL_META[id]?.slots.includes(slot) ?? false

  // Level 1: slot + dietary + no allergy match
  let pool = allIds.filter(id => isSlotOk(id) && isDietaryOk(id) && !hasAllergy(id))

  // Level 2: relax allergy filter when fewer than two meals survive
  if (pool.length < 2) {
    pool = allIds.filter(id => isSlotOk(id) && isDietaryOk(id))
  }

  // Level 3: relax dietary filter as last resort (shouldn't be needed with
  // current mock data but protects against future meal additions)
  if (pool.length < 2) {
    pool = allIds.filter(id => isSlotOk(id))
  }

  return pool
}

// ─── Slot assignment ───────────────────────────────────────────────────────────

// Scores and sorts the pool then cycles through it for all 7 days.
// Tie-breaking by meal ID string ensures determinism across calls.
// Back-to-back repeats are avoided when the pool has more than one option.
function assignSlot(pool: string[], state: OnboardingState): string[] {
  const params: ScoreParams = {
    cuisines: state.cuisines,
    emphasis: state.emphasis,
    fitness:  state.fitness,
    cookTime: state.cookTime,
  }

  // Sort descending by score, then ascending by ID for a stable tie-break
  const sorted = [...pool].sort((a, b) => {
    const mealA = MEALS[a]
    const mealB = MEALS[b]
    const metaA = MEAL_META[a]
    const metaB = MEAL_META[b]
    if (!mealA || !mealB || !metaA || !metaB) return 0
    const diff = scoreMeal(metaB, mealB, params) - scoreMeal(metaA, mealA, params)
    return diff !== 0 ? diff : a.localeCompare(b)
  })

  const result: string[] = []
  for (let day = 0; day < 7; day++) {
    const candidate = sorted[day % sorted.length]
    const prev = result[result.length - 1]
    if (prev !== undefined && candidate === prev && sorted.length > 1) {
      // Step one position forward to break consecutive repeats
      result.push(sorted[(day + 1) % sorted.length])
    } else {
      result.push(candidate)
    }
  }
  return result
}

// ─── Main export ───────────────────────────────────────────────────────────────

// Builds a deterministic seven-day meal plan from the onboarding state.
// Uses the static MEALS pool; same input → same output every time.
//
// FUTURE: replace the body of this function with a Gemini API call.
// The `OnboardingState` parameter maps directly to the prompt payload.
// Keep this file as the single integration point so no callers need to change.
export function generatePlan(state: OnboardingState): MealPlan {
  const breakfasts = assignSlot(filterPool('breakfast', state), state)
  const lunches    = assignSlot(filterPool('lunch',     state), state)
  const snacks     = assignSlot(filterPool('snack',     state), state)
  const dinners    = assignSlot(filterPool('dinner',    state), state)

  // Batch cooking: days 1…min(batch, 6) get the previous night's dinner as a
  // leftover lunch. Day 0 has no predecessor so it is always null.
  const batchCount = Math.min(state.batch, 6)

  return [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    breakfast: breakfasts[i],
    lunch:     lunches[i],
    snack:     snacks[i],
    dinner:    dinners[i],
    leftover:  i > 0 && i <= batchCount ? dinners[i - 1] : null,
  })) as MealPlan
}
