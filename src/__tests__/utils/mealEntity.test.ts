import {
  extractNameAndPrep,
  legacyIngredientToStructuredIngredient,
  adaptToMealEntity,
  favoriteRecordToMealEntity,
  buildMealEntitiesFromRuntime,
  scaleStructuredAmt,
} from '../../utils/mealEntity'
import type { Meal, Recipe } from '../../types/meal'
import type { FavoriteRecord } from '../../lib/firestoreSync'

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const baseMeal: Meal = {
  id: 'meal_1', name: 'Dal Tadka', glyph: 'Pot', tone: 'saffron',
  kcal: 350, p: 18, c: 45, fat: 8, sugar: 3, fiber: 12, time: 30,
  cuisine: 'North Indian',
}

const baseRecipe: Recipe = {
  id: 'meal_1', name: 'Dal Tadka', subtitle: 'Classic red lentil dal',
  servings: 2, time: 30, difficulty: 'Easy', tags: ['vegan', 'high-protein'],
  nutrition: { kcal: 350, p: 18, c: 45, fat: 8, sugar: 3, fiber: 12 },
  ingredients: [
    { name: 'Red Lentils', amt: '1 cup', category: 'Pantry' },
    { name: 'Onion, finely chopped', amt: '1 medium' },
    { name: 'Ginger', amt: '1 inch piece', category: 'Produce' },
  ],
  steps: ['Rinse lentils', 'Simmer until soft'],
  pairsWith: [],
}

// ─── extractNameAndPrep ────────────────────────────────────────────────────────

describe('extractNameAndPrep', () => {
  it('returns the full name as displayName when there is no separator', () => {
    const r = extractNameAndPrep('Red Lentils')
    expect(r.displayName).toBe('Red Lentils')
    expect(r.prep).toBe('')
  })

  it('splits on the first comma not inside parentheses', () => {
    const r = extractNameAndPrep('Onion, finely chopped')
    expect(r.displayName).toBe('Onion')
    expect(r.prep).toBe('finely chopped')
  })

  it('splits on an em-dash separator', () => {
    const r = extractNameAndPrep('Chicken – diced')
    expect(r.displayName).toBe('Chicken')
    expect(r.prep).toBe('diced')
  })

  it('preserves parenthetical commas and does not split inside them', () => {
    const r = extractNameAndPrep('Mixed Vegetables (Carrots, Beans)')
    expect(r.displayName).toBe('Mixed Vegetables (Carrots, Beans)')
    expect(r.prep).toBe('')
  })
})

// ─── legacyIngredientToStructuredIngredient ────────────────────────────────────

describe('legacyIngredientToStructuredIngredient', () => {
  it('parses a plain quantity with unit', () => {
    const r = legacyIngredientToStructuredIngredient({ name: 'Red Lentils', amt: '1 cup' }, 0)
    expect(r.id).toBe('ingredient_0')
    expect(r.name).toBe('Red Lentils')
    expect(r.canonicalName).toBe('red lentils')
    expect(r.quantity).toBe(1)
    expect(r.unit).toBe('cup')
    expect(r.displayQty).toBe('1 cup')
  })

  it('parses a unicode fraction', () => {
    const r = legacyIngredientToStructuredIngredient({ name: 'Butter', amt: '½ cup' })
    expect(r.quantity).toBe(0.5)
    expect(r.unit).toBe('cup')
    expect(r.displayQty).toBe('0.5 cup')
  })

  it('normalizes ASCII fractions to unicode before parsing', () => {
    const r = legacyIngredientToStructuredIngredient({ name: 'Cumin Seeds', amt: '1/2 tsp' })
    expect(r.quantity).toBe(0.5)
    expect(r.unit).toBe('tsp')
  })

  it('takes the lower bound of a range quantity', () => {
    const r = legacyIngredientToStructuredIngredient({ name: 'Garlic', amt: '2-3 cloves' })
    expect(r.quantity).toBe(2)
    expect(r.unit).toBe('clove')
  })

  it('strips trailing prep words from the unit', () => {
    const r = legacyIngredientToStructuredIngredient({ name: 'Ginger', amt: '1 inch piece' })
    expect(r.unit).toBe('inch')
    expect(r.quantity).toBe(1)
  })

  it('extracts prep from name into the prep field', () => {
    const r = legacyIngredientToStructuredIngredient({ name: 'Onion, finely chopped', amt: '1 medium' })
    expect(r.name).toBe('Onion')
    expect(r.prep).toBe('finely chopped')
    expect(r.unit).toBe('medium')
  })

  it('falls back to category Other when category is absent', () => {
    const r = legacyIngredientToStructuredIngredient({ name: 'Onion', amt: '1 medium' })
    expect(r.category).toBe('Other')
  })

  it('passes through an explicit category', () => {
    const r = legacyIngredientToStructuredIngredient(
      { name: 'Red Lentils', amt: '1 cup', category: 'Pantry' },
    )
    expect(r.category).toBe('Pantry')
  })
})

// ─── adaptToMealEntity ─────────────────────────────────────────────────────────

describe('adaptToMealEntity', () => {
  it('produces a MealEntity with nutrition from Meal flat fields', () => {
    const entity = adaptToMealEntity(baseMeal, baseRecipe, { source: 'gemini' })
    expect(entity.id).toBe('meal_1')
    expect(entity.source).toBe('gemini')
    expect(entity.cuisine).toBe('North Indian')
    expect(entity.nutrition.kcal).toBe(350)
    expect(entity.nutrition.p).toBe(18)
    expect(entity.servings).toBe(2)
    expect(entity.ingredients).toHaveLength(3)
    expect(entity.ingredients[0].name).toBe('Red Lentils')
    expect(entity.steps).toHaveLength(2)
  })

  it('uses sensible defaults when recipe is absent', () => {
    const entity = adaptToMealEntity(baseMeal)
    expect(entity.ingredients).toHaveLength(0)
    expect(entity.steps).toHaveLength(0)
    expect(entity.servings).toBe(1)
    expect(entity.difficulty).toBe('Medium')
    expect(entity.source).toBe('unknown')
  })
})

// ─── scaleStructuredAmt ───────────────────────────────────────────────────────

describe('scaleStructuredAmt', () => {
  it('scales a numeric quantity', () => {
    const ing = legacyIngredientToStructuredIngredient({ name: 'Red Lentils', amt: '1 cup' })
    expect(scaleStructuredAmt(ing, 2)).toBe('2 cup')
  })

  it('returns displayQty unchanged when quantity is null', () => {
    const ing = legacyIngredientToStructuredIngredient({ name: 'Salt', amt: 'to taste' })
    expect(scaleStructuredAmt(ing, 3)).toBe('to taste')
  })

  it('handles empty unit — no trailing space', () => {
    const ing = legacyIngredientToStructuredIngredient({ name: 'Eggs', amt: '2' })
    expect(scaleStructuredAmt(ing, 3)).toBe('6')
  })

  it('uses formatNum cleanly — no trailing zeros', () => {
    const ing = legacyIngredientToStructuredIngredient({ name: 'Butter', amt: '½ cup' })
    expect(scaleStructuredAmt(ing, 3)).toBe('1.5 cup')
  })
})

// ─── buildMealEntitiesFromRuntime ─────────────────────────────────────────────

describe('buildMealEntitiesFromRuntime', () => {
  const meals: Record<string, Meal> = {
    meal_1: baseMeal,
    meal_2: { ...baseMeal, id: 'meal_2', name: 'Chana Masala' },
  }
  const recipes: Record<string, Recipe> = {
    meal_1: baseRecipe,
  }

  it('produces one entity per meal in the input map', () => {
    const entities = buildMealEntitiesFromRuntime(meals, recipes, 'gemini')
    expect(Object.keys(entities)).toHaveLength(2)
    expect(entities['meal_1']).toBeDefined()
    expect(entities['meal_2']).toBeDefined()
  })

  it('links the matching recipe by ID — entity has populated ingredients', () => {
    const entities = buildMealEntitiesFromRuntime(meals, recipes, 'gemini')
    expect(entities['meal_1'].ingredients).toHaveLength(3)
    expect(entities['meal_1'].ingredients[0].name).toBe('Red Lentils')
  })

  it('assigns the passed source to every entity', () => {
    const entities = buildMealEntitiesFromRuntime(meals, recipes, 'gemini')
    expect(entities['meal_1'].source).toBe('gemini')
    expect(entities['meal_2'].source).toBe('gemini')
  })

  it('meal with no matching recipe produces a valid entity with empty ingredients and steps', () => {
    const entities = buildMealEntitiesFromRuntime(meals, {}, 'gemini')
    expect(entities['meal_1'].ingredients).toHaveLength(0)
    expect(entities['meal_1'].steps).toHaveLength(0)
    expect(entities['meal_1'].name).toBe('Dal Tadka')
  })
})

// ─── favoriteRecordToMealEntity ────────────────────────────────────────────────

describe('favoriteRecordToMealEntity', () => {
  it('returns null when the record has no meal snapshot', () => {
    const record: FavoriteRecord = { mealId: 'meal_1', source: 'unknown' }
    expect(favoriteRecordToMealEntity(record)).toBeNull()
  })

  it('converts a record with snapshot and recipeSnapshot to a MealEntity', () => {
    const record: FavoriteRecord = {
      mealId: 'meal_1',
      source: 'gemini',
      snapshot: baseMeal,
      recipeSnapshot: baseRecipe,
    }
    const entity = favoriteRecordToMealEntity(record)
    expect(entity).not.toBeNull()
    expect(entity!.source).toBe('gemini')
    expect(entity!.ingredients).toHaveLength(3)
  })
})
