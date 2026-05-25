// Pure helpers for favorites logic.
// No Firebase or React dependencies — safe to unit-test directly.

export function mergeFavorites(
  local: Set<string>,
  remote: Set<string>,
): { merged: Set<string>; toSave: string[] } {
  const merged = new Set([...local, ...remote])
  const toSave = [...local].filter(id => !remote.has(id))
  return { merged, toSave }
}

// Groups an array of items by cuisine. Items with no cuisine field (or an empty
// string) are placed under "Other".
export function groupByCuisine<T extends { cuisine?: string }>(items: T[]): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of items) {
    const key = item.cuisine?.trim() || 'Other'
    if (!result[key]) result[key] = []
    result[key].push(item)
  }
  return result
}

// Sorts cuisine group entries alphabetically, keeping "Other" last.
export function sortCuisineGroups<T>(groups: Record<string, T[]>): [string, T[]][] {
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.localeCompare(b)
  })
}
