// Frontend client for the generateMealPlan Firebase Function.
//
// Two exports:
//   callGenerateMealPlan — calls the Firebase Function (requires signed-in user)
//   validateGeminiPlan   — pure validator; returns typed response or null
//
// Errors thrown by callGenerateMealPlan carry a Firebase FunctionsError code:
//   'resource-exhausted' — daily cap reached; caller shows message + uses local fallback
//   'internal'           — Gemini generation failed; caller uses local fallback
//   'unauthenticated'    — should not occur if caller guards with signedIn check

import { getFunctions, httpsCallable } from 'firebase/functions'
import { getApp } from 'firebase/app'
import type { OnboardingState } from '../types/profile'
import type { Meal, Recipe, DayPlan } from '../types/meal'
import { firebaseServices } from './firebase'

// ─── Response type ─────────────────────────────────────────────────────────────
// Mirrors the return type of the Firebase Function.

export interface GeminiPlanResponse {
  days:         DayPlan[]
  meals:        Record<string, Meal>
  recipes:      Record<string, Recipe>
  groceryItems: Array<{ section: string; name: string; qty: string }>
}

// ─── Validation constants ──────────────────────────────────────────────────────

const VALID_GLYPHS = new Set<string>(['Bowl', 'Roti', 'Glass', 'Leaf', 'Stack', 'Dome', 'Pot', 'Rice', 'Cube'])
const VALID_TONES  = new Set<string>(['paprika', 'saffron', 'olive', 'ink'])
const SLOTS        = ['breakfast', 'lunch', 'snack', 'dinner'] as const
const NUM_FIELDS   = ['kcal', 'p', 'c', 'fat', 'sugar', 'fiber', 'time'] as const

// ─── Validator ─────────────────────────────────────────────────────────────────
// Pure function — no Firebase dependency. Safe to unit-test without mocking.
//
// Validation is intentionally strict on days and meals (the fields the UI
// renders for every card) and intentionally loose on recipes (a missing recipe
// falls back to the static RECIPE constant in the Recipe screen).

export function validateGeminiPlan(data: unknown): GeminiPlanResponse | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  // ── days ──────────────────────────────────────────────────────────────────
  if (!Array.isArray(d['days']) || d['days'].length !== 7) return null

  const mealIds = new Set<string>()
  for (const day of d['days'] as unknown[]) {
    if (!day || typeof day !== 'object') return null
    const entry = day as Record<string, unknown>

    for (const slot of SLOTS) {
      const val = entry[slot]
      if (typeof val !== 'string' || !val) return null
      mealIds.add(val)
    }

    const lo = entry['leftover']
    if (lo !== null && typeof lo !== 'string') return null
    if (typeof lo === 'string' && lo) mealIds.add(lo)
  }

  // ── meals ─────────────────────────────────────────────────────────────────
  // Every meal ID referenced in days must have a fully populated entry.
  if (!d['meals'] || typeof d['meals'] !== 'object') return null
  const meals = d['meals'] as Record<string, unknown>

  for (const id of mealIds) {
    const meal = meals[id]
    if (!meal || typeof meal !== 'object') return null
    const m = meal as Record<string, unknown>

    if (typeof m['name'] !== 'string' || !m['name']) return null

    for (const field of NUM_FIELDS) {
      const v = m[field]
      if (typeof v !== 'number' || !isFinite(v)) return null
    }

    if (!VALID_GLYPHS.has(m['glyph'] as string)) return null
    if (!VALID_TONES.has(m['tone'] as string)) return null
  }

  // ── recipes ───────────────────────────────────────────────────────────────
  // Every meal ID must have a recipe with a matching key. The backend converts
  // the recipes array → Record keyed by id before returning, so we can look up
  // directly. Rejecting here prevents the Recipe screen from silently falling
  // back to a placeholder when Gemini gives a recipe a different id than its meal.
  if (!d['recipes'] || typeof d['recipes'] !== 'object') return null
  const recipes = d['recipes'] as Record<string, unknown>
  for (const id of mealIds) {
    if (!recipes[id]) return null
  }

  // ── groceryItems ──────────────────────────────────────────────────────────
  if (!Array.isArray(d['groceryItems'])) return null
  for (const item of d['groceryItems'] as unknown[]) {
    if (!item || typeof item !== 'object') return null
    const i = item as Record<string, unknown>
    if (typeof i['section'] !== 'string') return null
    if (typeof i['name'] !== 'string')    return null
    if (typeof i['qty'] !== 'string')     return null
  }

  return data as GeminiPlanResponse
}

// ─── Firebase Function caller ──────────────────────────────────────────────────
// Calls the generateMealPlan callable function, then re-validates the result
// on the client side as a defence-in-depth check.
//
// Throws on network failure, Firebase error, or client-side validation failure.
// All callers (StoreContext.generatePlanAsync) must catch and fall back to
// the local generator when this throws.

export async function callGenerateMealPlan(state: OnboardingState): Promise<GeminiPlanResponse> {
  if (!firebaseServices) {
    throw new Error('Firebase is not configured — cannot call Gemini endpoint.')
  }

  // firebaseServices being non-null means initializeApp() already ran, so getApp() is safe.
  const app = getApp()
  const region = (import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION as string | undefined) || 'us-central1'
  const fns = getFunctions(app, region)

  // Type the output as unknown so we validate before trusting the shape.
  const callable = httpsCallable<OnboardingState, unknown>(fns, 'generateMealPlan', { timeout: 300_000 })
  const result = await callable(state)

  const validated = validateGeminiPlan(result.data)
  if (!validated) {
    throw new Error('Gemini returned an unrecognisable response shape.')
  }

  return validated
}
