import type { GrocerySection, StoreInfo } from '../types'

// ─── Weekly grocery list ───────────────────────────────────────────────────────
// Aggregated from the static PLAN. Quantities assume 2 servings per meal.
// FUTURE: generated dynamically from the live meal plan once Gemini
// integration is in place; this constant will no longer be needed.

export const GROCERY: GrocerySection[] = [
  {
    section: 'Produce',
    items: [
      { name: 'Yellow onion',               qty: '8'       },
      { name: 'Tomato',                      qty: '10'      },
      { name: 'Bell pepper, green',          qty: '3'       },
      { name: 'Bell pepper, red',            qty: '2'       },
      { name: 'Spinach',                     qty: '1 lb'    },
      { name: 'Fenugreek leaves (methi)',    qty: '1 bunch' },
      { name: 'Cilantro',                    qty: '2 bunches'},
      { name: 'Mint',                        qty: '1 bunch' },
      { name: 'Ginger',                      qty: '4 oz'    },
      { name: 'Garlic',                      qty: '1 head'  },
      { name: 'Green chili',                 qty: '12'      },
      { name: 'Lemon',                       qty: '4'       },
      { name: 'Banana',                      qty: '6'       },
      { name: 'Apple',                       qty: '4'       },
    ],
  },
  {
    section: 'Dairy & Protein',
    items: [
      { name: 'Paneer',        qty: '1 lb'       },
      { name: 'Tofu, firm',   qty: '14 oz'      },
      { name: 'Plain yogurt', qty: '32 oz'      },
      { name: 'Greek yogurt', qty: '17 oz'      },
      { name: 'Milk',         qty: '½ gallon'   },
      { name: 'Soy chunks',   qty: '7 oz'       },
    ],
  },
  {
    section: 'Pantry & Grains',
    items: [
      { name: 'Brown rice',                  qty: '2 lb'  },
      { name: 'Quinoa',                      qty: '11 oz' },
      { name: 'Multigrain flour',            qty: '4 lb'  },
      { name: 'Sorghum (jowar) flour',       qty: '1 lb'  },
      { name: 'Chickpea flour (besan)',      qty: '1 lb'  },
      { name: 'Kidney beans, dried',         qty: '11 oz' },
      { name: 'Chickpeas, dried',            qty: '11 oz' },
      { name: 'Yellow moong dal',            qty: '11 oz' },
      { name: 'Toor dal',                    qty: '9 oz'  },
      { name: 'Moth beans (for sprouting)',  qty: '7 oz'  },
      { name: 'Flattened rice (poha)',       qty: '9 oz'  },
      { name: 'Semolina (rava)',             qty: '11 oz' },
      { name: 'Idli rava',                   qty: '11 oz' },
    ],
  },
  {
    section: 'Spices & Oils',
    items: [
      { name: 'Cumin seeds',   qty: '✓ check' },
      { name: 'Mustard seeds', qty: '✓ check' },
      { name: 'Turmeric',      qty: '✓ check' },
      { name: 'Garam masala',  qty: '✓ check' },
      { name: 'Ghee',          qty: '7 oz'    },
      { name: 'Avocado oil',   qty: '17 fl oz'},
    ],
  },
]

// ─── Store list ────────────────────────────────────────────────────────────────
// Used to tag grocery items and render the store-grouped view.

export const STORES: StoreInfo[] = [
  { name: 'Trader Joe\'s',   color: '#b84a26' },
  { name: 'Whole Foods',     color: '#6b7a3a' },
  { name: 'Costco',          color: '#3a5a7a' },
  { name: 'Indian Grocery',  color: '#c89534' },
  { name: 'Farmers Market',  color: '#a8b687' },
  { name: 'Online',          color: '#8b7e6a' },
]
