// ─── Raw data shapes (as stored in src/data/grocery.ts) ───────────────────────

export interface GroceryItem {
  name: string
  qty: string  // free-form: "1 lb", "8", "✓ check", etc.
}

export interface GrocerySection {
  section: string
  items: GroceryItem[]
}

export interface StoreInfo {
  name: string
  color: string  // hex used as swatch
}

// ─── User-applied mutations (persisted in store) ───────────────────────────────

// Keyed by the ORIGINAL item name so tags and pantry state survive a rename.
export interface GroceryEdit {
  name?: string      // new display name
  qty?: string       // new quantity string
  removed?: boolean  // true = hidden from list
}

// item name → store name (e.g. "Paneer" → "Indian Grocery")
export type GroceryTagMap = Record<string, string>

// item name → quantity the user already has at home (numeric, same unit as qty)
export type PantryMap = Record<string, number>

// original item name → applied edit
export type GroceryEditMap = Record<string, GroceryEdit>

// An item the user added manually; `id` is used to remove it later
export interface GroceryAddition {
  id: string
  name: string
  qty: string
  custom: true
}

// section name → list of manually added items
export type GroceryAdditionsMap = Record<string, GroceryAddition[]>

// ─── Display-time enriched shapes (computed by utils/grocery.ts) ──────────────

// A grocery item after edits and additions have been applied, ready to render.
export interface DisplayGroceryItem {
  originalName: string  // key into GroceryTagMap, PantryMap, GroceryEditMap
  name: string          // current display name (may differ from originalName)
  qty: string
  renamed: boolean      // name was edited by the user
  quantified: boolean   // qty was edited by the user
  custom?: boolean      // true for manually added items
  id?: string           // set only for custom additions (needed for removal)
  section?: string      // set when building the by-store grouped view
}

export interface DisplayGrocerySection {
  section: string
  items: DisplayGroceryItem[]
}
