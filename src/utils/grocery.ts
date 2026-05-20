import type {
  GrocerySection,
  GroceryEditMap,
  GroceryAdditionsMap,
  GroceryTagMap,
  StoreInfo,
  DisplayGroceryItem,
  DisplayGrocerySection,
} from '../types/grocery'

// ─── Quantity parsing ──────────────────────────────────────────────────────────

// Unicode fractions that appear in grocery quantities
const FRACS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667,
}

// The result of parsing a free-form quantity string into its numeric parts.
export interface ParsedQty {
  count: number | null  // null when the string is non-numeric
  unit: string          // e.g. "lb", "oz", "gallon", ""
  raw: string           // original string, unchanged
}

/**
 * Parses a grocery quantity string into a numeric count and unit.
 * Returns count = null for check-mark entries ("✓ check") and any string
 * that doesn't start with a number or Unicode fraction.
 *
 * Examples:
 *   "8"        → { count: 8,    unit: "",      raw: "8"        }
 *   "1 lb"     → { count: 1,    unit: "lb",    raw: "1 lb"     }
 *   "½ gallon" → { count: 0.5,  unit: "gallon",raw: "½ gallon" }
 *   "✓ check"  → { count: null, unit: "✓ check", raw: "✓ check" }
 *   "1 bunch"  → { count: 1,    unit: "bunch", raw: "1 bunch"  }
 */
export function parseQty(qty: string): ParsedQty {
  if (!qty) return { count: null, unit: '', raw: qty }

  const s = qty.trim()

  // Pantry-check items like "✓ check" are purely informational — not numeric
  if (s.startsWith('✓')) return { count: null, unit: s, raw: s }

  const match = s.match(/^([\d.]+|[½¼¾⅓⅔])\s*(.*)$/)
  if (!match) return { count: null, unit: s, raw: s }

  const n = FRACS[match[1]] ?? parseFloat(match[1])
  return {
    count: isNaN(n) ? null : n,
    unit:  match[2] ?? '',
    raw:   s,
  }
}

/**
 * Formats a number for display next to a grocery unit.
 * Trims trailing zeros from sub-1 values; rounds larger values to 1 decimal.
 *
 * Examples: 0 → "0",  0.5 → "0.5",  0.50 → "0.5",  2 → "2",  1.5 → "1.5"
 */
export function formatNum(n: number): string {
  if (n === 0) return '0'
  if (n < 1) return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  return String(Math.round(n * 10) / 10)
}

// ─── Display section building ──────────────────────────────────────────────────

/**
 * Applies user edits and manual additions to the raw GROCERY constant,
 * producing the enriched list the Grocery screen renders.
 *
 * Rules:
 * - Items with `removed: true` in edits are filtered out entirely.
 * - Items with a name/qty edit get the new value; flags indicate what changed.
 * - Manual additions are appended after the generated items in their section.
 *
 * FUTURE: when grocery lists are generated dynamically from a live meal plan,
 * this function will receive the generated sections instead of the static GROCERY.
 */
export function buildDisplaySections(
  sections: GrocerySection[],
  edits: GroceryEditMap,
  additions: GroceryAdditionsMap,
): DisplayGrocerySection[] {
  return sections.map((section) => {
    const generated: DisplayGroceryItem[] = section.items
      .filter((item) => !edits[item.name]?.removed)
      .map((item) => {
        const edit = edits[item.name]
        return {
          originalName: item.name,
          name:         edit?.name ?? item.name,
          qty:          edit?.qty  ?? item.qty,
          renamed:      !!edit?.name && edit.name !== item.name,
          quantified:   !!edit?.qty  && edit.qty  !== item.qty,
        }
      })

    // Manual additions use their stable `id` as the originalName so they can
    // be targeted by pantry adjustments or further edits in the future.
    const added: DisplayGroceryItem[] = (additions[section.section] ?? []).map(
      (addition) => ({
        originalName: addition.id,
        name:         addition.name,
        qty:          addition.qty,
        renamed:      false,
        quantified:   false,
        custom:       true,
        id:           addition.id,
      }),
    )

    return { section: section.section, items: [...generated, ...added] }
  })
}

/**
 * Groups display items by their assigned store tag for the "By store" view.
 * Items with no tag land under the sentinel key '__untagged__'.
 * Each item gains a `section` field so the store view can show its aisle origin.
 */
export function buildItemsByStore(
  displaySections: DisplayGrocerySection[],
  tags: GroceryTagMap,
): Record<string, DisplayGroceryItem[]> {
  const groups: Record<string, DisplayGroceryItem[]> = {}

  for (const section of displaySections) {
    for (const item of section.items) {
      const tag = tags[item.originalName] ?? '__untagged__'
      if (!groups[tag]) groups[tag] = []
      groups[tag].push({ ...item, section: section.section })
    }
  }

  return groups
}

/**
 * Looks up a StoreInfo by name, returning a neutral grey fallback for unknown stores.
 * Used when rendering store tags that were entered as custom free text.
 */
export function findStore(stores: StoreInfo[], name: string): StoreInfo {
  return stores.find((s) => s.name === name) ?? { name, color: '#8b7e6a' }
}
