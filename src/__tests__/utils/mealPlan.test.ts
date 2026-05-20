import { resolveSlot, scaleAmt, batchPreview, routeLabel, MEAL_SLOT_LIST } from '../../utils/mealPlan'
import type { DayPlan, MealRecord } from '../../types/meal'
import type { OverrideMap } from '../../types/store'

const meals: MealRecord = {
  poha:   { id: 'poha',   name: 'Poha',   glyph: 'Bowl', tone: 'saffron', kcal: 320, p: 10, c: 55, fat: 7, sugar: 4, fiber: 3, time: 15 },
  khichdi:{ id: 'khichdi',name: 'Khichdi',glyph: 'Pot',  tone: 'olive',  kcal: 400, p: 18, c: 65, fat: 8, sugar: 3, fiber: 5, time: 25 },
  dal:    { id: 'dal',    name: 'Dal',    glyph: 'Bowl', tone: 'paprika', kcal: 350, p: 20, c: 45, fat: 6, sugar: 2, fiber: 6, time: 30 },
}

const plan: DayPlan = { breakfast: 'poha', lunch: 'khichdi', snack: 'dal', dinner: 'dal', leftover: null }

describe('MEAL_SLOT_LIST', () => {
  it('has four entries in correct order', () => {
    expect(MEAL_SLOT_LIST.map(s => s.key)).toEqual(['breakfast', 'lunch', 'snack', 'dinner'])
  })
})

describe('resolveSlot', () => {
  it('returns planned meal when no override exists', () => {
    const result = resolveSlot(0, 'breakfast', plan, meals, {})
    expect(result.kind).toBe('default')
    expect(result.meal?.id).toBe('poha')
  })

  it('treats default override same as no override', () => {
    const overrides: OverrideMap = { '0_breakfast': { kind: 'default' } }
    const result = resolveSlot(0, 'breakfast', plan, meals, overrides)
    expect(result.kind).toBe('default')
    expect(result.meal?.id).toBe('poha')
  })

  it('returns meal=null for eating-out', () => {
    const overrides: OverrideMap = { '0_dinner': { kind: 'eating-out', name: 'Pizza place' } }
    const result = resolveSlot(0, 'dinner', plan, meals, overrides)
    expect(result.kind).toBe('eating-out')
    expect(result.meal).toBeNull()
    expect(result.name).toBe('Pizza place')
  })

  it('returns meal=null for removed', () => {
    const overrides: OverrideMap = { '1_snack': { kind: 'removed' } }
    const result = resolveSlot(1, 'snack', plan, meals, overrides)
    expect(result.kind).toBe('removed')
    expect(result.meal).toBeNull()
  })

  it('returns meal=null for self-cook', () => {
    const overrides: OverrideMap = { '2_lunch': { kind: 'self-cook', name: 'My pasta' } }
    const result = resolveSlot(2, 'lunch', plan, meals, overrides)
    expect(result.kind).toBe('self-cook')
    expect(result.meal).toBeNull()
    expect(result.name).toBe('My pasta')
  })

  it('returns substituted meal for custom override', () => {
    const overrides: OverrideMap = { '0_breakfast': { kind: 'custom', mealId: 'khichdi' } }
    const result = resolveSlot(0, 'breakfast', plan, meals, overrides)
    expect(result.kind).toBe('custom')
    expect(result.meal?.id).toBe('khichdi')
  })

  it('returns null meal for custom override with unknown mealId', () => {
    const overrides: OverrideMap = { '0_breakfast': { kind: 'custom', mealId: 'unknown_id' } }
    const result = resolveSlot(0, 'breakfast', plan, meals, overrides)
    expect(result.meal).toBeNull()
  })

  it('scopes override to correct dayIndex', () => {
    // Override for day 3 should not affect day 0
    const overrides: OverrideMap = { '3_breakfast': { kind: 'removed' } }
    const result = resolveSlot(0, 'breakfast', plan, meals, overrides)
    expect(result.meal?.id).toBe('poha')
  })
})

describe('scaleAmt', () => {
  it('returns unchanged when ratio is 1', () => {
    expect(scaleAmt('9 oz', 1)).toBe('9 oz')
    expect(scaleAmt('½ tsp', 1)).toBe('½ tsp')
  })

  it('scales whole number amounts', () => {
    expect(scaleAmt('9 oz', 2)).toBe('18 oz')
    expect(scaleAmt('2 cups', 3)).toBe('6 cups')
  })

  it('scales unicode fractions', () => {
    expect(scaleAmt('½ tsp', 2)).toBe('1 tsp')
    expect(scaleAmt('¼ cup', 4)).toBe('1 cup')
    expect(scaleAmt('¾ cup', 2)).toBe('1.5 cup')
    expect(scaleAmt('⅓ cup', 3)).toBe('1 cup')
    expect(scaleAmt('⅔ cup', 3)).toBe('2 cup')
  })

  it('handles decimal results under 1', () => {
    expect(scaleAmt('1 tbsp', 0.5)).toBe('0.5 tbsp')
  })

  it('returns original string for unparseable amounts', () => {
    expect(scaleAmt('to taste', 2)).toBe('to taste')
    expect(scaleAmt('a pinch', 3)).toBe('a pinch')
  })

  it('trims trailing unit whitespace when unit is empty', () => {
    expect(scaleAmt('3', 2)).toBe('6')
  })
})

describe('batchPreview', () => {
  it('returns fresh cook message for n=0', () => {
    expect(batchPreview(0)).toContain('cook every dinner fresh')
    expect(batchPreview(0)).toContain('7 cook sessions')
  })

  it('returns stretch message for n=7', () => {
    expect(batchPreview(7)).toContain('Every dinner gets stretched')
    expect(batchPreview(7)).toContain('4 active cook days')
  })

  it('returns interpolated message for mid values', () => {
    const msg = batchPreview(2)
    expect(msg).toContain('cook sessions')
    expect(msg).toContain('2 dinners')
  })

  it('uses singular dinner for n=1', () => {
    expect(batchPreview(1)).toContain('1 dinner will reappear')
  })
})

describe('routeLabel', () => {
  it('maps known routes', () => {
    expect(routeLabel('landing')).toBe('01 Landing')
    expect(routeLabel('grocery')).toBe('06 Grocery list')
    expect(routeLabel('nutrition')).toBe('07 Nutrition summary')
  })

  it('falls back to raw string for unknown routes', () => {
    expect(routeLabel('unknown_screen')).toBe('unknown_screen')
  })
})
