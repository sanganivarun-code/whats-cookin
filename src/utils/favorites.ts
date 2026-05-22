// Pure helper for merging signed-out temporary favorites with Firestore favorites on sign-in.
// No Firebase or React dependencies — safe to unit-test directly.

export function mergeFavorites(
  local: Set<string>,
  remote: Set<string>,
): { merged: Set<string>; toSave: string[] } {
  const merged = new Set([...local, ...remote])
  const toSave = [...local].filter(id => !remote.has(id))
  return { merged, toSave }
}
