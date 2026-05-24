// Firestore sync helpers for meal plans and favorites.
//
// The pure serialization helpers (planToDays / docToPlan) have no Firebase
// dependency so they can be unit-tested without mocking Firestore.
// The CRUD functions each accept `db` as a parameter for the same reason.
//
// Data layout:
//   users/{uid}/plans/{planId}    — saved weekly plans
//   users/{uid}/favorites/{mealId} — favorited meal IDs (doc ID = mealId)

import type { Firestore } from 'firebase/firestore'
import {
  collection, addDoc, getDocs,
  query, orderBy, limit,
  doc, setDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import type { MealPlan, DayPlan, Meal, Recipe, GlyphKind, ColorTone } from '../types/meal'

// Stored shape of a single meal override. Mirrors types/store.ts Override but
// defined here to avoid a circular import (types/store.ts imports FavoriteRecord
// from this file).
interface StoredOverride {
  kind: string
  name?: string
  mealId?: string
}

// ─── Favorite records ──────────────────────────────────────────────────────────

// Where the favorited meal came from.
export type FavoriteSource = 'gemini' | 'sample' | 'custom' | 'unknown'

// Stored in users/{uid}/favorites/{mealId}.
// snapshot persists the full meal so Favorites page survives refresh without runtimeMeals.
// recipeSnapshot persists the full recipe so the Recipe page works without a loaded plan.
// Legacy documents written before this format have no source, snapshot, or recipeSnapshot;
// docToFavoriteRecord handles them gracefully.
export interface FavoriteRecord {
  mealId: string
  source: FavoriteSource
  snapshot?: Meal
  recipeSnapshot?: Recipe
}

// Converts a raw Firestore document to a FavoriteRecord.
// Never throws — falls back to { mealId: docId, source: 'unknown' } on bad data.
export function docToFavoriteRecord(data: unknown, docId: string): FavoriteRecord {
  if (!data || typeof data !== 'object') return { mealId: docId, source: 'unknown' }
  const d = data as Record<string, unknown>

  const mealId = typeof d['mealId'] === 'string' ? d['mealId'] : docId
  const source: FavoriteSource =
    d['source'] === 'gemini' ? 'gemini' :
    d['source'] === 'sample' ? 'sample' :
    d['source'] === 'custom' ? 'custom' :
    'unknown'

  let snapshot: Meal | undefined
  const s = d['snapshot']
  if (s && typeof s === 'object' && !Array.isArray(s)) {
    const snap = s as Record<string, unknown>
    if (
      typeof snap['id']    === 'string' &&
      typeof snap['name']  === 'string' &&
      typeof snap['glyph'] === 'string' &&
      typeof snap['tone']  === 'string' &&
      typeof snap['kcal']  === 'number' &&
      typeof snap['p']     === 'number' &&
      typeof snap['c']     === 'number' &&
      typeof snap['fat']   === 'number' &&
      typeof snap['sugar'] === 'number' &&
      typeof snap['fiber'] === 'number' &&
      typeof snap['time']  === 'number'
    ) {
      snapshot = {
        id:      snap['id']    as string,
        name:    snap['name']  as string,
        glyph:   snap['glyph'] as GlyphKind,
        tone:    snap['tone']  as ColorTone,
        kcal:    snap['kcal']  as number,
        p:       snap['p']     as number,
        c:       snap['c']     as number,
        fat:     snap['fat']   as number,
        sugar:   snap['sugar'] as number,
        fiber:   snap['fiber'] as number,
        time:    snap['time']  as number,
        cuisine: typeof snap['cuisine'] === 'string' ? snap['cuisine'] : undefined,
      }
    }
  }

  // Lightweight recipeSnapshot validation: trust our own Gemini data shape but
  // guard against missing required fields so malformed docs don't crash the app.
  let recipeSnapshot: Recipe | undefined
  const rs = d['recipeSnapshot']
  if (
    rs &&
    typeof rs === 'object' &&
    !Array.isArray(rs)
  ) {
    const r = rs as Record<string, unknown>
    if (
      typeof r['id']          === 'string' &&
      typeof r['name']        === 'string' &&
      Array.isArray(r['steps']) &&
      Array.isArray(r['ingredients'])
    ) {
      recipeSnapshot = rs as Recipe
    }
  }

  return { mealId, source, snapshot, recipeSnapshot }
}

// ─── Pure serialization (no Firebase types) ────────────────────────────────────

// Converts a MealPlan tuple to a plain-object array safe to store in Firestore.
export function planToDays(plan: MealPlan): DayPlan[] {
  return plan.map(day => ({ ...day }))
}

// Validates raw Firestore document data and returns a typed MealPlan or null.
// Returns null for any schema mismatch so callers never crash on bad data.
export function docToPlan(data: unknown): MealPlan | null {
  if (!data || typeof data !== 'object') return null

  const d = data as Record<string, unknown>
  if (!Array.isArray(d.days) || d.days.length !== 7) return null

  const SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'] as const
  for (const day of d.days as unknown[]) {
    if (!day || typeof day !== 'object') return null
    const entry = day as Record<string, unknown>
    for (const slot of SLOTS) {
      if (typeof entry[slot] !== 'string') return null
    }
    const left = entry.leftover
    if (left !== null && typeof left !== 'string') return null
  }

  return d.days as MealPlan
}

// ─── Firestore CRUD ────────────────────────────────────────────────────────────

// Saves a plan document and returns the new document ID.
export async function savePlan(db: Firestore, uid: string, plan: MealPlan): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'plans'), {
    uid,
    createdAt: serverTimestamp(),
    days: planToDays(plan),
  })
  return ref.id
}

// Loads the most recently saved plan for a user, or null if none exists.
export async function loadLatestPlan(db: Firestore, uid: string): Promise<MealPlan | null> {
  const q = query(
    collection(db, 'users', uid, 'plans'),
    orderBy('createdAt', 'desc'),
    limit(1),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return docToPlan(snap.docs[0].data())
}

// Saves a single favorite with its full snapshot. The document ID is the meal ID for O(1) lookup.
export async function saveFavorite(db: Firestore, uid: string, record: FavoriteRecord): Promise<void> {
  const payload: Record<string, unknown> = {
    mealId:  record.mealId,
    savedAt: serverTimestamp(),
    source:  record.source,
  }
  if (record.snapshot)       payload['snapshot']       = record.snapshot
  if (record.recipeSnapshot) payload['recipeSnapshot'] = record.recipeSnapshot
  await setDoc(doc(db, 'users', uid, 'favorites', record.mealId), payload)
}

// Removes a single favorite.
export async function removeFavorite(db: Firestore, uid: string, mealId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'favorites', mealId))
}

// Loads all favorites for a user as a Map keyed by meal ID.
// Backward-compatible: legacy documents that lack source/snapshot fields still load.
export async function loadFavorites(db: Firestore, uid: string): Promise<Map<string, FavoriteRecord>> {
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'))
  const result = new Map<string, FavoriteRecord>()
  for (const d of snap.docs) {
    result.set(d.id, docToFavoriteRecord(d.data(), d.id))
  }
  return result
}

// ─── Extended plan (Gemini-generated plans with runtime meal/recipe/grocery) ───
// Stored in the same users/{uid}/plans collection.
// Extra fields are absent in documents saved by the original savePlan() —
// docToExtendedPlan defaults gracefully so old documents still load correctly.

// 'gemini'             — generated by Gemini (normal signed-in path)
// 'local-dev-fallback' — local generator used (dev/test only)
// 'sample'             — static sample plan
// Old documents written before M7 have source='local-generator' or no source field;
// docToExtendedPlan maps these to 'local-dev-fallback' for backward compatibility.
export type PlanSource = 'gemini' | 'local-dev-fallback' | 'sample'

export interface LoadedExtendedPlan {
  plan:          MealPlan
  source:        PlanSource
  runtimeMeals:  Record<string, Meal>
  runtimeRecipes: Record<string, Recipe>
  runtimeGrocery: Array<{ section: string; name: string; qty: string }>
  overrides:     Record<string, StoredOverride>
}

// Pure serialization helper — converts a raw Firestore document to a
// LoadedExtendedPlan or null. No Firebase types; safe to unit-test directly.
export function docToExtendedPlan(data: unknown): LoadedExtendedPlan | null {
  // Re-use the existing days validator to avoid duplicating that logic.
  const plan = docToPlan(data)
  if (!plan) return null

  const d = data as Record<string, unknown>

  const source: PlanSource =
    d['source'] === 'gemini' ? 'gemini' :
    d['source'] === 'sample' ? 'sample' :
    'local-dev-fallback'

  const runtimeMeals: Record<string, Meal> =
    d['runtimeMeals'] && typeof d['runtimeMeals'] === 'object' && !Array.isArray(d['runtimeMeals'])
      ? (d['runtimeMeals'] as Record<string, Meal>)
      : {}

  const runtimeRecipes: Record<string, Recipe> =
    d['runtimeRecipes'] && typeof d['runtimeRecipes'] === 'object' && !Array.isArray(d['runtimeRecipes'])
      ? (d['runtimeRecipes'] as Record<string, Recipe>)
      : {}

  const runtimeGrocery: Array<{ section: string; name: string; qty: string }> =
    Array.isArray(d['runtimeGrocery']) ? d['runtimeGrocery'] as Array<{ section: string; name: string; qty: string }> : []

  const overrides: Record<string, StoredOverride> =
    d['overrides'] && typeof d['overrides'] === 'object' && !Array.isArray(d['overrides'])
      ? (d['overrides'] as Record<string, StoredOverride>)
      : {}

  return { plan, source, runtimeMeals, runtimeRecipes, runtimeGrocery, overrides }
}

// Saves an extended plan document and returns the new document ID.
// For Gemini plans, pass runtimeMeals, runtimeRecipes, and runtimeGrocery.
// For local plans, omit those fields — the document will match the old savePlan format.
export async function saveExtendedPlan(
  db: Firestore,
  uid: string,
  payload: {
    plan:           MealPlan
    source:         PlanSource
    runtimeMeals?:  Record<string, Meal>
    runtimeRecipes?: Record<string, Recipe>
    runtimeGrocery?: Array<{ section: string; name: string; qty: string }>
    overrides?:     Record<string, StoredOverride>
  },
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'plans'), {
    uid,
    createdAt:      serverTimestamp(),
    source:         payload.source,
    days:           planToDays(payload.plan),
    runtimeMeals:   payload.runtimeMeals   ?? {},
    runtimeRecipes: payload.runtimeRecipes ?? {},
    runtimeGrocery: payload.runtimeGrocery ?? [],
    overrides:      payload.overrides      ?? {},
  })
  return ref.id
}

// Loads the most recently saved extended plan for a user, or null if none exists.
export async function loadLatestExtendedPlan(db: Firestore, uid: string): Promise<LoadedExtendedPlan | null> {
  const q = query(
    collection(db, 'users', uid, 'plans'),
    orderBy('createdAt', 'desc'),
    limit(1),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return docToExtendedPlan(snap.docs[0].data())
}
