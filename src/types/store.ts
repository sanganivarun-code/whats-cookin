import type { MealSlot, MealPlan } from './meal'
import type {
  GroceryTagMap,
  PantryMap,
  GroceryEditMap,
  GroceryAdditionsMap,
  GroceryEdit,
} from './grocery'
import type { OnboardingState, UserProfile } from './profile'

// ─── Routing ──────────────────────────────────────────────────────────────────

export type AppRoute =
  | 'landing'
  | 'onboarding'
  | 'loading'
  | 'today'
  | 'dashboard'
  | 'recipe'
  | 'grocery'
  | 'nutrition'

// ─── Meal overrides ───────────────────────────────────────────────────────────

// What the user has decided to do with a specific meal slot.
export type OverrideKind =
  | 'eating-out'  // skip entirely — not counted in nutrition or grocery
  | 'self-cook'   // user cooks their own recipe; name only, no ingredients
  | 'custom'      // swap in a known meal from the library
  | 'removed'     // leave the slot empty
  | 'default'     // restore original planned meal (clears an override)

export interface Override {
  kind: OverrideKind
  name?: string    // display name for self-cook and custom overrides
  mealId?: string  // library meal ID for custom overrides
}

// Keyed as `${dayIndex}_${slot}` so the whole week fits in one flat map.
export type OverrideMap = Record<string, Override>

// ─── Edit UI ──────────────────────────────────────────────────────────────────

// Set when the user taps "Edit / Swap" on a meal card; opens MealEditSheet.
export interface EditTarget {
  dayIndex: number
  slot: MealSlot
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Static mock user — replaced by real auth in a future milestone.
export interface AppUser {
  name: string
  initial: string
  email: string
}

// ─── Full store state ─────────────────────────────────────────────────────────

// The complete shape exposed by StoreContext. Keeping it here (separate from
// the context file) lets utility functions and tests import just the type
// without pulling in React.
export interface StoreState {
  // Auth
  signedIn: boolean
  user: AppUser
  authOpen: boolean
  setAuthOpen: (open: boolean) => void
  signIn: () => void
  signOut: () => void

  // Favorites
  favorites: Set<string>
  toggleFavorite: (mealId: string) => void

  // Meal overrides (manual edits to the generated plan)
  overrides: OverrideMap
  setOverride: (dayIndex: number, slot: MealSlot, value: Override | null) => void
  getOverride: (dayIndex: number, slot: MealSlot) => Override | null

  // Inline meal editing
  editTarget: EditTarget | null
  setEditTarget: (target: EditTarget | null) => void

  // Plan persistence
  planSaved: boolean
  setPlanSaved: (saved: boolean) => void

  // Grocery: store tags
  groceryTags: GroceryTagMap
  setGroceryTag: (itemName: string, tag: string | null) => void

  // Grocery: pantry stock adjustments
  pantryHave: PantryMap
  setHave: (itemName: string, amount: number) => void

  // Grocery: item edits (rename / requantify / remove)
  groceryEdits: GroceryEditMap
  setGroceryEdit: (originalName: string, edit: GroceryEdit | null) => void

  // Grocery: manually added items
  groceryAdditions: GroceryAdditionsMap
  addGroceryItem: (section: string, name: string, qty: string) => void
  removeGroceryAddition: (section: string, id: string) => void

  // Onboarding: raw form data persisted so re-entering the flow restores answers
  onboardingState: OnboardingState | null
  setOnboardingState: (s: OnboardingState) => void

  // Derived user profile (set when onboarding completes)
  profile: UserProfile | null
  setProfile: (p: UserProfile) => void

  // Recipe navigation: meal ID of the card the user tapped to open the recipe
  recipeTarget: string | null
  setRecipeTarget: (id: string | null) => void

  // Generated plan: set on onboarding completion; replaces the static PLAN fallback
  generatedPlan: MealPlan | null
  setGeneratedPlan: (plan: MealPlan) => void
}
