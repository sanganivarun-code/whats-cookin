import { parseQty, formatNum } from './grocery'
import type {
  Meal, Recipe, RecipeIngredient,
  MealEntity, StructuredIngredient, IngredientCategory, MealSource,
} from '../types/meal'
import type { FavoriteRecord } from '../lib/firestoreSync'

// ─── Internal helpers ──────────────────────────────────────────────────────────

// Words that appear as trailing descriptors in a parsed unit string but carry
// no unit meaning: "1 inch piece" → unit "inch", not "inch piece".
const PREP_WORDS = new Set([
  'chopped', 'diced', 'sliced', 'minced', 'grated', 'shredded',
  'crushed', 'peeled', 'halved', 'quartered', 'roughly', 'finely',
  'coarsely', 'thinly', 'piece', 'pieces',
])

// Maps plural/abbreviation variants to the canonical lowercase unit.
const UNIT_ALIASES: Record<string, string> = {
  cups: 'cup',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsps: 'tbsp',
  teaspoon: 'tsp',   teaspoons: 'tsp',    tsps: 'tsp',
  ounce: 'oz',       ounces: 'oz',
  pound: 'lb',       pounds: 'lb',        lbs: 'lb',
  gram: 'g',         grams: 'g',
  kilogram: 'kg',    kilograms: 'kg',
  milliliter: 'ml',  milliliters: 'ml',
  liter: 'l',        liters: 'l',
  cloves: 'clove',
  stalks: 'stalk',
  sprigs: 'sprig',
}

// Normalizes ASCII fractions to unicode and collapses range quantities to the
// lower bound ("1-2 cloves" → "1 cloves").
function cleanLegacyAmt(amt: string): string {
  if (!amt) return amt
  let s = amt.trim()
  s = s
    .replace(/\b1\/2\b/g, '½')
    .replace(/\b1\/4\b/g, '¼')
    .replace(/\b3\/4\b/g, '¾')
    .replace(/\b1\/3\b/g, '⅓')
    .replace(/\b2\/3\b/g, '⅔')
  // Range: take lower bound
  s = s.replace(/^([\d.]+)\s*[-–]\s*[\d.]+(\s*)/, '$1$2')
  return s
}

// Strips trailing PREP_WORDS from a parsed unit string.
// Preserves single-word units even if they happen to be prep words.
function cleanLegacyUnit(unit: string): string {
  if (!unit) return unit
  const words = unit.split(/\s+/)
  while (words.length > 1 && PREP_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop()
  }
  return words.join(' ').trim()
}

function normalizeUnitAlias(unit: string): string {
  return UNIT_ALIASES[unit.toLowerCase()] ?? unit
}

// ─── Exported utilities ────────────────────────────────────────────────────────

/**
 * Splits a legacy RecipeIngredient name into a display name and an optional
 * preparation descriptor.
 *
 * Priority:
 *   1. Em/en dash with surrounding spaces ("Chicken – diced")
 *   2. First comma NOT inside parentheses ("Onion, finely chopped")
 *   3. No separator → prep = ""
 *
 * Parenthetical commas are preserved:
 *   "Mixed Vegetables (Carrots, Beans)" → displayName = full string, prep = ""
 */
export function extractNameAndPrep(name: string): { displayName: string; prep: string } {
  const s = name.trim()

  const dashIdx = s.search(/\s[–-]\s/)
  if (dashIdx !== -1) {
    return {
      displayName: s.slice(0, dashIdx).trim(),
      prep:        s.slice(dashIdx).replace(/^\s*[–-]\s*/, '').trim(),
    }
  }

  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') depth--
    else if (s[i] === ',' && depth === 0) {
      return {
        displayName: s.slice(0, i).trim(),
        prep:        s.slice(i + 1).trim(),
      }
    }
  }

  return { displayName: s, prep: '' }
}

/**
 * Converts a single RecipeIngredient to the structured form.
 * `index` is the position in the parent recipe's ingredients array and is used
 * to generate a stable `id`.
 */
export function legacyIngredientToStructuredIngredient(
  ingredient: RecipeIngredient,
  index = 0,
): StructuredIngredient {
  const { displayName, prep } = extractNameAndPrep(ingredient.name)

  const cleanedAmt = cleanLegacyAmt(ingredient.amt)
  const parsed     = parseQty(cleanedAmt)
  const rawUnit    = cleanLegacyUnit(parsed.unit)
  const unit       = normalizeUnitAlias(rawUnit)

  const quantity   = parsed.count
  const displayQty = quantity !== null
    ? unit ? `${formatNum(quantity)} ${unit}` : formatNum(quantity)
    : parsed.raw || ingredient.amt

  const category: IngredientCategory = ingredient.category ?? 'Other'

  return {
    id:            `ingredient_${index}`,
    name:          displayName,
    canonicalName: displayName.toLowerCase(),
    quantity,
    unit,
    displayQty,
    ...(prep ? { prep } : {}),
    category,
  }
}

/**
 * Adapts a legacy Meal + optional Recipe pair to a unified MealEntity.
 * Nutrition always comes from the Meal flat fields (authoritative source).
 * When recipe is absent, ingredients/steps/etc. default to empty.
 */
export function adaptToMealEntity(
  meal: Meal,
  recipe?: Recipe,
  options?: { source?: MealSource },
): MealEntity {
  const ingredients = recipe?.ingredients.map(
    (ing, idx) => legacyIngredientToStructuredIngredient(ing, idx),
  ) ?? []

  return {
    id:         meal.id,
    name:       meal.name,
    cuisine:    meal.cuisine ?? 'Other',
    source:     options?.source ?? 'unknown',
    glyph:      meal.glyph,
    tone:       meal.tone,
    servings:   recipe?.servings    ?? 1,
    time:       meal.time,
    difficulty: recipe?.difficulty  ?? 'Medium',
    tags:       recipe?.tags        ?? [],
    subtitle:   recipe?.subtitle    ?? '',
    nutrition: {
      kcal:  meal.kcal,
      p:     meal.p,
      c:     meal.c,
      fat:   meal.fat,
      sugar: meal.sugar,
      fiber: meal.fiber,
    },
    ingredients,
    steps:      recipe?.steps      ?? [],
    pairsWith:  recipe?.pairsWith  ?? [],
  }
}

/**
 * Converts a FavoriteRecord to a MealEntity, or returns null when the record
 * has no meal snapshot (legacy favorites written before snapshot persistence).
 */
export function favoriteRecordToMealEntity(record: FavoriteRecord): MealEntity | null {
  if (!record.snapshot) return null
  return adaptToMealEntity(record.snapshot, record.recipeSnapshot, { source: record.source })
}

/**
 * Scales a StructuredIngredient's quantity by `ratio` for the servings stepper.
 * Returns `displayQty` unchanged when ratio is 1 or quantity is null (non-numeric).
 */
export function scaleStructuredAmt(ingredient: StructuredIngredient, ratio: number): string {
  if (ratio === 1 || ingredient.quantity === null) return ingredient.displayQty
  const scaled = `${formatNum(ingredient.quantity * ratio)}${ingredient.unit ? ' ' + ingredient.unit : ''}`
  return scaled.trim()
}

/**
 * Builds a Record<id, MealEntity> from parallel runtime meal and recipe maps.
 * Every meal in `meals` gets an entity; a missing recipe entry produces an
 * entity with empty ingredients and steps (valid, not an error).
 */
export function buildMealEntitiesFromRuntime(
  meals: Record<string, Meal>,
  recipes: Record<string, Recipe>,
  source: MealSource,
): Record<string, MealEntity> {
  return Object.fromEntries(
    Object.entries(meals).map(([id, meal]) => [
      id,
      adaptToMealEntity(meal, recipes[id], { source }),
    ]),
  )
}
