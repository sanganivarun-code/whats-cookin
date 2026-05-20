import {
  parseQty,
  formatNum,
  buildDisplaySections,
  buildItemsByStore,
  findStore,
} from '../../utils/grocery'
import type { GrocerySection, StoreInfo } from '../../types/grocery'
import type { GroceryEditMap, GroceryAdditionsMap, GroceryTagMap } from '../../types/grocery'

// ─── parseQty ─────────────────────────────────────────────────────────────────

describe('parseQty', () => {
  it('parses a plain integer', () => {
    const r = parseQty('8')
    expect(r.count).toBe(8)
    expect(r.unit).toBe('')
    expect(r.raw).toBe('8')
  })

  it('parses count with unit', () => {
    const r = parseQty('1 lb')
    expect(r.count).toBe(1)
    expect(r.unit).toBe('lb')
  })

  it('parses unicode fraction with unit', () => {
    expect(parseQty('½ gallon').count).toBe(0.5)
    expect(parseQty('½ gallon').unit).toBe('gallon')
    expect(parseQty('¼ tsp').count).toBe(0.25)
    expect(parseQty('¾ cup').count).toBe(0.75)
    expect(parseQty('⅓ cup').count).toBeCloseTo(0.333)
    expect(parseQty('⅔ cup').count).toBeCloseTo(0.667)
  })

  it('parses decimal count', () => {
    const r = parseQty('1.5 cups')
    expect(r.count).toBe(1.5)
    expect(r.unit).toBe('cups')
  })

  it('returns count=null and unit=full-string for check items', () => {
    const r = parseQty('✓ check')
    expect(r.count).toBeNull()
    expect(r.unit).toBe('✓ check')
    expect(r.raw).toBe('✓ check')
  })

  it('returns count=null for non-numeric strings', () => {
    const r = parseQty('a bunch')
    expect(r.count).toBeNull()
    expect(r.unit).toBe('a bunch')
  })

  it('handles empty string', () => {
    const r = parseQty('')
    expect(r.count).toBeNull()
    expect(r.unit).toBe('')
    expect(r.raw).toBe('')
  })

  it('preserves raw as original string', () => {
    expect(parseQty('  2 oz  ').raw).toBe('2 oz') // trimmed
  })
})

// ─── formatNum ────────────────────────────────────────────────────────────────

describe('formatNum', () => {
  it('formats zero', () => {
    expect(formatNum(0)).toBe('0')
  })

  it('formats sub-1 decimals without trailing zeros', () => {
    expect(formatNum(0.5)).toBe('0.5')
    expect(formatNum(0.25)).toBe('0.25')
    expect(formatNum(0.50)).toBe('0.5')
  })

  it('formats whole integers', () => {
    expect(formatNum(2)).toBe('2')
    expect(formatNum(10)).toBe('10')
  })

  it('rounds to one decimal for values >= 1', () => {
    expect(formatNum(1.5)).toBe('1.5')
    expect(formatNum(2.05)).toBe('2.1') // rounds up
    expect(formatNum(3.14159)).toBe('3.1')
  })
})

// ─── buildDisplaySections ─────────────────────────────────────────────────────

const sections: GrocerySection[] = [
  {
    section: 'Produce',
    items: [
      { name: 'Onion', qty: '8' },
      { name: 'Tomato', qty: '10' },
      { name: 'Spinach', qty: '1 lb' },
    ],
  },
  {
    section: 'Dairy',
    items: [{ name: 'Paneer', qty: '1 lb' }],
  },
]

describe('buildDisplaySections', () => {
  it('returns items unchanged when no edits or additions', () => {
    const result = buildDisplaySections(sections, {}, {})
    expect(result[0].items).toHaveLength(3)
    expect(result[0].items[0].name).toBe('Onion')
    expect(result[0].items[0].qty).toBe('8')
    expect(result[0].items[0].renamed).toBe(false)
    expect(result[0].items[0].quantified).toBe(false)
  })

  it('filters out removed items', () => {
    const edits: GroceryEditMap = { Tomato: { removed: true } }
    const result = buildDisplaySections(sections, edits, {})
    expect(result[0].items.map(i => i.name)).not.toContain('Tomato')
    expect(result[0].items).toHaveLength(2)
  })

  it('applies name edit and sets renamed flag', () => {
    const edits: GroceryEditMap = { Onion: { name: 'Red Onion' } }
    const result = buildDisplaySections(sections, edits, {})
    const onion = result[0].items.find(i => i.originalName === 'Onion')!
    expect(onion.name).toBe('Red Onion')
    expect(onion.renamed).toBe(true)
    expect(onion.quantified).toBe(false)
  })

  it('applies qty edit and sets quantified flag', () => {
    const edits: GroceryEditMap = { Spinach: { qty: '2 lb' } }
    const result = buildDisplaySections(sections, edits, {})
    const spinach = result[0].items.find(i => i.originalName === 'Spinach')!
    expect(spinach.qty).toBe('2 lb')
    expect(spinach.quantified).toBe(true)
    expect(spinach.renamed).toBe(false)
  })

  it('appends manual additions after generated items', () => {
    const additions: GroceryAdditionsMap = {
      Produce: [{ id: 'add_1', name: 'Kale', qty: '1 bunch', custom: true }],
    }
    const result = buildDisplaySections(sections, {}, additions)
    const produceItems = result[0].items
    expect(produceItems).toHaveLength(4)
    const kale = produceItems[produceItems.length - 1]
    expect(kale.name).toBe('Kale')
    expect(kale.custom).toBe(true)
    expect(kale.id).toBe('add_1')
    expect(kale.originalName).toBe('add_1')
  })

  it('does not set renamed when edit name equals original name', () => {
    const edits: GroceryEditMap = { Onion: { name: 'Onion' } }
    const result = buildDisplaySections(sections, edits, {})
    const onion = result[0].items.find(i => i.originalName === 'Onion')!
    expect(onion.renamed).toBe(false)
  })
})

// ─── buildItemsByStore ────────────────────────────────────────────────────────

describe('buildItemsByStore', () => {
  it('groups tagged items under their store key', () => {
    const displaySections = buildDisplaySections(sections, {}, {})
    const tags: GroceryTagMap = {
      Onion: 'Trader Joe\'s',
      Tomato: 'Whole Foods',
    }
    const groups = buildItemsByStore(displaySections, tags)
    expect(groups['Trader Joe\'s']).toHaveLength(1)
    expect(groups['Trader Joe\'s'][0].name).toBe('Onion')
    expect(groups['Whole Foods'][0].name).toBe('Tomato')
  })

  it('puts untagged items under __untagged__', () => {
    const displaySections = buildDisplaySections(sections, {}, {})
    const groups = buildItemsByStore(displaySections, {})
    expect(groups['__untagged__']).toHaveLength(4) // 3 produce + 1 dairy
  })

  it('attaches section field to each item', () => {
    const displaySections = buildDisplaySections(sections, {}, {})
    const groups = buildItemsByStore(displaySections, {})
    expect(groups['__untagged__'][0].section).toBe('Produce')
  })
})

// ─── findStore ────────────────────────────────────────────────────────────────

describe('findStore', () => {
  const stores: StoreInfo[] = [
    { name: 'Trader Joe\'s', color: '#b84a26' },
    { name: 'Whole Foods', color: '#6b7a3a' },
  ]

  it('finds a known store by name', () => {
    const s = findStore(stores, 'Whole Foods')
    expect(s.color).toBe('#6b7a3a')
  })

  it('returns grey fallback for unknown store', () => {
    const s = findStore(stores, 'Corner Bodega')
    expect(s.name).toBe('Corner Bodega')
    expect(s.color).toBe('#8b7e6a')
  })
})
