import type { GlyphKind } from './meal'

// ─── Enumerated choice types ───────────────────────────────────────────────────

export type DietaryLine =
  | 'Vegetarian'
  | 'Vegan'
  | 'Eggetarian'
  | 'Non-vegetarian'
  | 'Pescatarian'

export type CuisineId =
  | 'north_indian'
  | 'south_indian'
  | 'gujarati'
  | 'bengali'
  | 'mediterranean'
  | 'thai'
  | 'mexican'
  | 'japanese'

export type EmphasisId =
  | 'high_protein'
  | 'low_sugar'
  | 'low_carb'
  | 'weight_loss'
  | 'muscle'
  | 'gut'

export type FitnessGoal = 'lose' | 'maintain' | 'muscle' | 'performance'

// ─── Metadata for rendering choice grids in the onboarding UI ─────────────────

export interface CuisineMeta {
  id: CuisineId
  label: string
  glyph: GlyphKind
}

export interface EmphasisMeta {
  id: EmphasisId
  label: string
  glyph: GlyphKind
}

// ─── Onboarding and profile shapes ────────────────────────────────────────────

// Collected step-by-step during onboarding; becomes the input to plan generation.
// FUTURE: this is the payload sent to the Gemini meal-plan generation endpoint.
export interface OnboardingState {
  diet: DietaryLine
  cuisines: CuisineId[]
  emphasis: EmphasisId[]
  household: number     // number of adults to cook for
  goalKcal: number      // daily calorie target
  cookTime: number      // max weekday cook time in minutes
  batch: number         // how many dinners should stretch into next-day lunches
  allergies: string     // free-text, comma-separated
  fitness?: FitnessGoal
}

// Saved profile shown in the app header and plan summaries.
export interface UserProfile {
  household: string    // display name e.g. "Aanya & Rohan"
  servings: number
  goalKcal: number
  goalProtein: number
  diet: DietaryLine
  cuisines: string[]   // display labels
  emphasis: string[]   // display labels
}
