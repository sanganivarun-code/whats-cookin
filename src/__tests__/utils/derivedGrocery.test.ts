import { deriveGrocerySectionsFromEntities } from '../../utils/derivedGrocery'
import type { MealPlan, MealEntity } from '../../types/meal'
import type { OverrideMap } from '../../types/store'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeEntity(id: string, overrides: Partial<MealEntity> = {}): MealEntity {
  return {
    id,
    name: `Meal ${id}`,
    cuisine: 'Other',
    source: 'gemini',
    glyph: 'Pot',
    tone: 'olive',
    servings: 2,
    time: 30,
    difficulty: 'Medium',
    tags: [],
    subtitle: '',
    nutrition: { kcal: 400, p: 20, c: 50, fat: 10, sugar: 4, fiber: 6 },
    ingredients: [],
    steps: [],
    pairsWith: [],
    ...overrides,
  }
}

function makeIngredient(
  name: string,
  qty: number | null,
  unit: string,
  category: MealEntity['ingredients'][number]['category'] = 'Produce',
): MealEntity['ingredients'][number] {
  return {
    id: `ing_${name}`,
    name,
    canonicalName: name.toLowerCase(),
    quantity: qty,
    unit,
    displayQty: qty != null ? `${qty}${unit ? ' ' + unit : ''}` : 'to taste',
    prep: '',
    category,
  }
}

const emptyPlan: MealPlan = Array.from({ length: 7 }, () => ({
  breakfast: '', lunch: '', snack: '', dinner: '', leftover: null,
})) as unknown as MealPlan

function oneDayPlan(mealId: string, slot: 'breakfast' | 'lunch' | 'snack' | 'dinner' = 'breakfast'): MealPlan {
  const plan = emptyPlan.map(d => ({ ...d })) as unknown as MealPlan
  plan[0] = { breakfast: '', lunch: '', snack: '', dinner: '', leftover: null, [slot]: mealId }
  return plan
}

const noOverrides: OverrideMap = {}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('deriveGrocerySectionsFromEntities', () => {
  it('includes ingredients from a normal planned slot', () => {
    const entity = makeEntity('m1', { ingredients: [makeIngredient('Onion', 2, 'medium')] })
    const plan = oneDayPlan('m1', 'breakfast')
    const { sections, skippedIds } = deriveGrocerySectionsFromEntities(plan, noOverrides, (id) => id === 'm1' ? entity : undefined)
    expect(skippedIds).toHaveLength(0)
    expect(sections).toHaveLength(1)
    expect(sections[0].section).toBe('Produce')
    expect(sections[0].items[0].name).toBe('Onion')
  })

  it('skips the lunch slot when planDay.leftover is set', () => {
    const entity = makeEntity('m_lunch', { ingredients: [makeIngredient('Tomato', 3, 'medium')] })
    const plan = emptyPlan.map(d => ({ ...d })) as unknown as MealPlan
    plan[0] = { breakfast: '', lunch: 'm_lunch', snack: '', dinner: '', leftover: 'm_dinner' }
    const getEntity = (id: string) => id === 'm_lunch' ? entity : undefined
    const { sections, skippedIds } = deriveGrocerySectionsFromEntities(plan, noOverrides, getEntity)
    expect(skippedIds).toHaveLength(0)
    expect(sections).toHaveLength(0) // lunch skipped, nothing else in plan
  })

  it('excludes an eating-out slot and does not report it in skippedIds', () => {
    const plan = oneDayPlan('m1', 'breakfast')
    const overrides: OverrideMap = { '0_breakfast': { kind: 'eating-out' } }
    const entity = makeEntity('m1', { ingredients: [makeIngredient('Egg', 2, '')] })
    const { sections, skippedIds } = deriveGrocerySectionsFromEntities(plan, overrides, () => entity)
    expect(skippedIds).toHaveLength(0)
    expect(sections).toHaveLength(0)
  })

  it('excludes a removed slot and does not report it in skippedIds', () => {
    const plan = oneDayPlan('m1', 'dinner')
    const overrides: OverrideMap = { '0_dinner': { kind: 'removed' } }
    const entity = makeEntity('m1', { ingredients: [makeIngredient('Paneer', 1, 'cup', 'Dairy & Protein')] })
    const { sections, skippedIds } = deriveGrocerySectionsFromEntities(plan, overrides, () => entity)
    expect(skippedIds).toHaveLength(0)
    expect(sections).toHaveLength(0)
  })

  it('excludes a self-cook override without mealId and does not report it in skippedIds', () => {
    const plan = oneDayPlan('m1', 'lunch')
    const overrides: OverrideMap = { '0_lunch': { kind: 'self-cook', name: 'My Pasta' } }
    const entity = makeEntity('m1', { ingredients: [makeIngredient('Pasta', 200, 'g', 'Grains & Bread')] })
    const { sections, skippedIds } = deriveGrocerySectionsFromEntities(plan, overrides, () => entity)
    expect(skippedIds).toHaveLength(0)
    expect(sections).toHaveLength(0)
  })

  it('uses the mealId from a custom override', () => {
    const customEntity = makeEntity('custom_m', { ingredients: [makeIngredient('Lentils', 1, 'cup', 'Pantry')] })
    const plan = oneDayPlan('original_m', 'dinner')
    const overrides: OverrideMap = { '0_dinner': { kind: 'custom', name: 'Dal', mealId: 'custom_m' } }
    const getEntity = (id: string) => id === 'custom_m' ? customEntity : undefined
    const { sections, skippedIds } = deriveGrocerySectionsFromEntities(plan, overrides, getEntity)
    expect(skippedIds).toHaveLength(0)
    expect(sections).toHaveLength(1)
    expect(sections[0].items[0].name).toBe('Lentils')
  })

  it('reports a meal ID in skippedIds when getEntity returns undefined', () => {
    const plan = oneDayPlan('missing_m', 'snack')
    const { skippedIds } = deriveGrocerySectionsFromEntities(plan, noOverrides, () => undefined)
    expect(skippedIds).toContain('missing_m')
  })

  it('reports a meal ID in skippedIds when the entity has no ingredients', () => {
    const emptyEntity = makeEntity('empty_m', { ingredients: [] })
    const plan = oneDayPlan('empty_m', 'breakfast')
    const { skippedIds } = deriveGrocerySectionsFromEntities(plan, noOverrides, () => emptyEntity)
    expect(skippedIds).toContain('empty_m')
  })

  it('sums quantities for the same canonicalName + unit across meals', () => {
    const e1 = makeEntity('m1', { ingredients: [makeIngredient('Onion', 1, 'medium')] })
    const e2 = makeEntity('m2', { ingredients: [makeIngredient('Onion', 2, 'medium')] })
    const plan = emptyPlan.map(d => ({ ...d })) as unknown as MealPlan
    plan[0] = { breakfast: 'm1', lunch: '', snack: 'm2', dinner: '', leftover: null }
    const getEntity = (id: string) => id === 'm1' ? e1 : id === 'm2' ? e2 : undefined
    const { sections } = deriveGrocerySectionsFromEntities(plan, noOverrides, getEntity)
    const produce = sections.find(s => s.section === 'Produce')
    const onion = produce?.items.find(i => i.name === 'Onion')
    expect(onion?.qty).toBe('3 medium')
  })
})
