// Core macro + micro values. Used on Meal, Recipe, and all computed totals
// so everything shares the same shape.
export interface NutritionInfo {
  kcal: number
  p: number     // protein grams
  c: number     // carb grams
  fat: number
  sugar: number
  fiber: number
}

// These are the same shape as NutritionInfo but named separately so call
// sites are clear about what they're working with.
export type DayTotals = NutritionInfo
export type WeekAverages = NutritionInfo
