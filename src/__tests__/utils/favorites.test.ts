import { mergeFavorites } from '../../utils/favorites'

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
