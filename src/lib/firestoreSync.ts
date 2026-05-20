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
import type { MealPlan, DayPlan } from '../types/meal'

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

// Saves a single favorite. The document ID is the meal ID for O(1) lookup.
export async function saveFavorite(db: Firestore, uid: string, mealId: string): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'favorites', mealId), {
    mealId,
    savedAt: serverTimestamp(),
  })
}

// Removes a single favorite.
export async function removeFavorite(db: Firestore, uid: string, mealId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'favorites', mealId))
}

// Loads all favorites for a user as a Set of meal IDs.
export async function loadFavorites(db: Firestore, uid: string): Promise<Set<string>> {
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'))
  return new Set(snap.docs.map(d => d.id))
}
