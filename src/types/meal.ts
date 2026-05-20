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
