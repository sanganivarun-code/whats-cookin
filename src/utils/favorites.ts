// Pure helpers for favorites logic.
// No Firebase or React dependencies — safe to unit-test directly.

import type { Meal } from '../types/meal'

export function mergeFavorites(
  local: Set<string>,
  remote: Set<string>,
): { merged: Set<string>; toSave: string[] } {
  const merged = new Set([...local, ...remote])
  const toSave = [...local].filter(id => !remote.has(id))
  return { merged, toSave }
}

// Groups an array of meals by cuisine. Meals with no cuisine field (or an empty
// string) are placed under "Other".
export function groupByCuisine(meals: Meal[]): Record<string, Meal[]> {
  const result: Record<string, Meal[]> = {}
  for (const meal of meals) {
    const key = meal.cuisine?.trim() || 'Other'
    if (!result[key]) result[key] = []
    result[key].push(meal)
  }
  return result
}

// Sorts cuisine group entries alphabetically, keeping "Other" last.
export function sortCuisineGroups(groups: Record<string, Meal[]>): [string, Meal[]][] {
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.localeCompare(b)
  })
}
