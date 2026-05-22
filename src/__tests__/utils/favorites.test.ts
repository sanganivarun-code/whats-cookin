import { mergeFavorites, groupByCuisine, sortCuisineGroups } from '../../utils/favorites'
import type { Meal } from '../../types/meal'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMeal(id: string, cuisine?: string): Meal {
  return {
    id, name: id,
    glyph: 'Bowl', tone: 'paprika',
    kcal: 400, p: 20, c: 50, fat: 10, sugar: 5, fiber: 4, time: 20,
    cuisine,
  }
}

// ─── mergeFavorites ───────────────────────────────────────────────────────────

describe('mergeFavorites', () => {
  it('returns empty merged set and empty toSave when both are empty', () => {
    const { merged, toSave } = mergeFavorites(new Set(), new Set())
    expect(merged.size).toBe(0)
    expect(toSave).toEqual([])
  })

  it('saves local-only IDs when remote is empty', () => {
    const { merged, toSave } = mergeFavorites(new Set(['a', 'b']), new Set())
    expect(merged).toEqual(new Set(['a', 'b']))
    expect(toSave).toEqual(expect.arrayContaining(['a', 'b']))
    expect(toSave).toHaveLength(2)
  })

  it('loads remote IDs without re-saving them when local is empty', () => {
    const { merged, toSave } = mergeFavorites(new Set(), new Set(['x', 'y']))
    expect(merged).toEqual(new Set(['x', 'y']))
    expect(toSave).toEqual([])
  })

  it('unions local and remote, saves only local-only IDs', () => {
    const { merged, toSave } = mergeFavorites(new Set(['a', 'b']), new Set(['b', 'c']))
    expect(merged).toEqual(new Set(['a', 'b', 'c']))
    expect(toSave).toEqual(['a'])
  })

  it('produces no duplicates in toSave when local has repeated overlap', () => {
    const { merged, toSave } = mergeFavorites(new Set(['a', 'b']), new Set(['a', 'b']))
    expect(merged).toEqual(new Set(['a', 'b']))
    expect(toSave).toEqual([])
  })

  it('does not mutate the input sets', () => {
    const local = new Set(['a'])
    const remote = new Set(['b'])
    mergeFavorites(local, remote)
    expect(local).toEqual(new Set(['a']))
    expect(remote).toEqual(new Set(['b']))
  })

  it('handles a single local-only ID correctly', () => {
    const { merged, toSave } = mergeFavorites(new Set(['paneer_bhurji']), new Set(['khichdi']))
    expect(merged).toEqual(new Set(['paneer_bhurji', 'khichdi']))
    expect(toSave).toEqual(['paneer_bhurji'])
  })
})

// ─── groupByCuisine ───────────────────────────────────────────────────────────

describe('groupByCuisine', () => {
  it('returns an empty object for an empty array', () => {
    expect(groupByCuisine([])).toEqual({})
  })

  it('groups meals by their cuisine field', () => {
    const meals = [
      makeMeal('a', 'North Indian'),
      makeMeal('b', 'North Indian'),
      makeMeal('c', 'South Indian'),
    ]
    const result = groupByCuisine(meals)
    expect(result['North Indian']).toHaveLength(2)
    expect(result['South Indian']).toHaveLength(1)
    expect(result['North Indian'].map(m => m.id)).toEqual(['a', 'b'])
  })

  it('places meals with undefined cuisine under Other', () => {
    const result = groupByCuisine([makeMeal('x')])
    expect(result['Other']).toHaveLength(1)
    expect(result['Other'][0].id).toBe('x')
  })

  it('places meals with an empty string cuisine under Other', () => {
    const result = groupByCuisine([makeMeal('x', '')])
    expect(result['Other']).toHaveLength(1)
  })

  it('places meals with a whitespace-only cuisine under Other', () => {
    const result = groupByCuisine([makeMeal('x', '   ')])
    expect(result['Other']).toHaveLength(1)
  })

  it('preserves meal order within each group', () => {
    const meals = [makeMeal('first', 'Indian'), makeMeal('second', 'Indian')]
    const result = groupByCuisine(meals)
    expect(result['Indian'].map(m => m.id)).toEqual(['first', 'second'])
  })

  it('does not mutate the input array', () => {
    const meals = [makeMeal('a', 'Indian')]
    groupByCuisine(meals)
    expect(meals).toHaveLength(1)
  })
})

// ─── sortCuisineGroups ────────────────────────────────────────────────────────

describe('sortCuisineGroups', () => {
  it('returns an empty array for empty groups', () => {
    expect(sortCuisineGroups({})).toEqual([])
  })

  it('sorts group names alphabetically', () => {
    const groups = {
      'South Indian': [makeMeal('s')],
      'North Indian': [makeMeal('n')],
      'Indian':       [makeMeal('i')],
    }
    const sorted = sortCuisineGroups(groups).map(([name]) => name)
    expect(sorted).toEqual(['Indian', 'North Indian', 'South Indian'])
  })

  it('places Other last regardless of alphabetical position', () => {
    const groups = {
      'Other':        [makeMeal('o')],
      'Mediterranean':[makeMeal('m')],
      'North Indian': [makeMeal('n')],
    }
    const sorted = sortCuisineGroups(groups).map(([name]) => name)
    expect(sorted[sorted.length - 1]).toBe('Other')
  })

  it('keeps Other last even when it would sort first alphabetically', () => {
    // "Other" sorts after "Z..." alphabetically but must still be last
    const groups = {
      'Other':   [makeMeal('o')],
      'Zzz':     [makeMeal('z')],
    }
    const sorted = sortCuisineGroups(groups).map(([name]) => name)
    expect(sorted).toEqual(['Zzz', 'Other'])
  })

  it('returns a single group unchanged', () => {
    const groups = { 'Indian': [makeMeal('a'), makeMeal('b')] }
    const sorted = sortCuisineGroups(groups)
    expect(sorted).toHaveLength(1)
    expect(sorted[0][0]).toBe('Indian')
    expect(sorted[0][1]).toHaveLength(2)
  })
})
