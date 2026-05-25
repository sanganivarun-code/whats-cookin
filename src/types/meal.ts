import type { NutritionInfo } from './nutrition'

// ─── Visual representation ─────────────────────────────────────────────────────

// Names of the SVG food glyphs defined in components/icons/FoodGlyph.tsx
export type GlyphKind =
  | 'Bowl'
  | 'Roti'
  | 'Glass'
  | 'Leaf'
  | 'Stack'
  | 'Dome'
  | 'Pot'
  | 'Rice'
  | 'Cube'

// Colour palette applied to a glyph's icon and background
export type ColorTone = 'paprika' | 'saffron' | 'olive' | 'ink'

// ─── Meal plan structure ───────────────────────────────────────────────────────

// The four slots in a single day
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner'

// A single dish in the meal library
export interface Meal {
  id: string
  name: string
  glyph: GlyphKind
  tone: ColorTone
  kcal: number
  p: number     // protein grams
  c: number     // carb grams
  fat: number
  sugar: number
  fiber: number
  time: number  // active cook time in minutes; 0 = no cooking needed
  cuisine?: string  // e.g. "North Indian", "South Indian", "Mediterranean"; absent → grouped as "Other"
}

// All meals keyed by ID for O(1) lookup
export type MealRecord = Record<string, Meal>

// One day in the generated weekly plan
export interface DayPlan {
  breakfast: string        // meal ID
  lunch: string            // meal ID
  snack: string            // meal ID
  dinner: string           // meal ID
  leftover: string | null  // meal ID; shown as next-day lunch when set
}

// Seven days make a full plan
export type MealPlan = [DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan]

// Calendar metadata for each day — used in headers and labels
export interface DayMeta {
  name: string   // "Monday"
  short: string  // "Mon"
  date: string   // "May 19"
}

// ─── Recipe ───────────────────────────────────────────────────────────────────

export interface RecipeIngredient {
  name: string
  amt: string  // free-form: "9 oz", "1 medium", "½ green"
  category?: 'Produce' | 'Dairy & Protein' | 'Grains & Bread' | 'Spices & Oils' | 'Pantry' | 'Other'
}

// ─── Unified meal domain model ─────────────────────────────────────────────────

export type IngredientCategory =
  | 'Produce'
  | 'Dairy & Protein'
  | 'Grains & Bread'
  | 'Spices & Oils'
  | 'Pantry'
  | 'Other'

// Pre-parsed ingredient with stable structured fields.
// Replaces free-form RecipeIngredient.amt parsing at read time.
export interface StructuredIngredient {
  id:            string         // "ingredient_0", "ingredient_1", …
  name:          string         // display name, prep stripped
  canonicalName: string         // name.toLowerCase() — merge / dedup key
  quantity:      number | null  // null for non-numeric ("a handful", "✓ check")
  unit:          string         // canonical unit ("cup", "tbsp") or descriptor ("medium")
  displayQty:    string         // human-readable quantity + unit
  prep?:         string         // "finely chopped", "grated", …
  category:      IngredientCategory
}

export type MealSource = 'gemini' | 'sample' | 'custom' | 'unknown'

// Unified meal record combining Meal + Recipe into a single flat entity.
// Adapters in src/utils/mealEntity.ts convert legacy types to this shape.
export interface MealEntity {
  id:          string
  name:        string
  cuisine:     string
  mealType?:   MealSlot
  source:      MealSource
  glyph:       GlyphKind
  tone:        ColorTone
  servings:    number
  time:        number
  difficulty:  string
  tags:        string[]
  subtitle:    string
  nutrition:   NutritionInfo
  ingredients: StructuredIngredient[]
  steps:       string[]
  pairsWith:   string[]
}

export interface Recipe {
  id: string
  name: string
  subtitle: string
  servings: number
  time: number        // cook time in minutes
  difficulty: string  // "Easy" | "Medium" | "Hard"
  tags: string[]
  nutrition: NutritionInfo  // per serving
  ingredients: RecipeIngredient[]
  steps: string[]
  pairsWith: string[]  // meal IDs from the library
}
