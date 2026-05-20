import type { Recipe } from '../types'

// The single sample recipe shown in the Recipe detail screen.
// FUTURE: replaced by a fetch from the recipe library once the backend exists.

export const RECIPE: Recipe = {
  id: 'paneer_bhurji',
  name: 'Paneer Bhurji + Multigrain Roti',
  subtitle: 'Scrambled paneer, onions and peppers — fast, protein-dense, easy to scale.',
  servings: 2,
  time: 25,
  difficulty: 'Easy',
  tags: ['High protein', 'Vegetarian', 'North Indian', 'Under 30 min'],
  nutrition: { kcal: 540, p: 34, c: 42, fat: 22, sugar: 5, fiber: 8 },
  ingredients: [
    { name: 'Paneer, crumbled',          amt: '9 oz',     category: 'Dairy & Protein' },
    { name: 'Onion, finely chopped',     amt: '1 medium', category: 'Produce'         },
    { name: 'Tomato, finely chopped',    amt: '1 medium', category: 'Produce'         },
    { name: 'Bell pepper, diced',        amt: '½ green',  category: 'Produce'         },
    { name: 'Green chillies, slit',      amt: '2',        category: 'Produce'         },
    { name: 'Ginger, grated',            amt: '1 tsp',    category: 'Produce'         },
    { name: 'Cumin seeds',               amt: '1 tsp',    category: 'Spices & Oils'   },
    { name: 'Turmeric',                  amt: '¼ tsp',    category: 'Spices & Oils'   },
    { name: 'Garam masala',              amt: '½ tsp',    category: 'Spices & Oils'   },
    { name: 'Cilantro, chopped',         amt: '2 tbsp',   category: 'Produce'         },
    { name: 'Multigrain flour',          amt: '1 cup',    category: 'Grains & Bread'  },
    { name: 'Ghee',                      amt: '1 tbsp',   category: 'Spices & Oils'   },
  ],
  steps: [
    'Knead the multigrain dough with warm water and a pinch of salt. Rest covered for 10 minutes while you prep the bhurji.',
    'Heat ghee in a wide pan, splutter cumin seeds, then add ginger and green chillies. Sauté 30 seconds.',
    'Add onion and cook until edges turn golden, about 3–4 minutes. Stir in capsicum and cook 2 minutes more.',
    'Add tomato, turmeric and a pinch of salt. Cook until tomatoes break down and oil separates.',
    'Fold in the crumbled paneer and toss gently — you want streaks of yellow, not a paste. Cook 2 minutes.',
    'Finish with garam masala and coriander. Roll and roast 4 rotis on a hot tawa, brush with a touch of ghee.',
  ],
  pairsWith: ['khichdi', 'buttermilk'],
}
