import type { MealPlan, MealEntity, IngredientCategory, StructuredIngredient } from '../types/meal'
import type { OverrideMap } from '../types/store'
import type { GrocerySection } from '../types/grocery'
import { MEAL_SLOT_LIST } from './mealPlan'
import { formatNum } from './grocery'

interface MergedRow {
  name: string
  canonicalName: string
  quantity: number | null
  unit: string
  displayQty: string
  category: IngredientCategory
}

export interface DerivationResult {
  sections: GrocerySection[]
  skippedIds: string[]
}

const CATEGORY_ORDER: IngredientCategory[] = [
  'Produce', 'Dairy & Protein', 'Grains & Bread', 'Spices & Oils', 'Pantry', 'Other',
]

export function deriveGrocerySectionsFromEntities(
  plan: MealPlan,
  overrides: OverrideMap,
  getEntity: (id: string) => MealEntity | undefined,
): DerivationResult {
  const mergeMap = new Map<string, MergedRow>()
  const skippedIds: string[] = []

  for (let dayIndex = 0; dayIndex < plan.length; dayIndex++) {
    const planDay = plan[dayIndex]

    for (const slot of MEAL_SLOT_LIST) {
      // Skip the lunch slot when it's a leftover day — dinner already counted
      if (slot.key === 'lunch' && planDay.leftover) continue

      const overrideKey = `${dayIndex}_${slot.key}`
      const override = overrides[overrideKey]
      let effectiveMealId: string | null = null

      if (!override || override.kind === 'default') {
        effectiveMealId = planDay[slot.key]
      } else if ((override.kind === 'custom' || override.kind === 'self-cook') && override.mealId) {
        effectiveMealId = override.mealId
      } else {
        // eating-out, removed, self-cook without mealId — intentionally excluded
        continue
      }

      if (!effectiveMealId) continue

      const entity = getEntity(effectiveMealId)
      if (!entity) {
        skippedIds.push(effectiveMealId)
        continue
      }
      if (entity.ingredients.length === 0) {
        skippedIds.push(effectiveMealId)
        continue
      }

      for (const ing of entity.ingredients) {
        mergeIngredient(mergeMap, ing)
      }
    }
  }

  const byCategory = new Map<IngredientCategory, Array<{ name: string; qty: string }>>()
  for (const row of mergeMap.values()) {
    if (!byCategory.has(row.category)) byCategory.set(row.category, [])
    byCategory.get(row.category)!.push({ name: row.name, qty: row.displayQty })
  }

  const sections: GrocerySection[] = CATEGORY_ORDER
    .filter(cat => byCategory.has(cat))
    .map(cat => ({ section: cat, items: byCategory.get(cat)! }))

  return { sections, skippedIds: [...new Set(skippedIds)] }
}

function mergeIngredient(map: Map<string, MergedRow>, ing: StructuredIngredient): void {
  const key = `${ing.canonicalName}:::${ing.unit}`
  const existing = map.get(key)
  if (!existing) {
    map.set(key, {
      name: ing.name,
      canonicalName: ing.canonicalName,
      quantity: ing.quantity,
      unit: ing.unit,
      displayQty: ing.displayQty,
      category: ing.category,
    })
    return
  }
  if (existing.quantity !== null && ing.quantity !== null) {
    const total = existing.quantity + ing.quantity
    existing.quantity = total
    existing.displayQty = `${formatNum(total)}${ing.unit ? ' ' + ing.unit : ''}`.trim()
  }
  // If either is null: keep existing (conservative dedupe)
}
