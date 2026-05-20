// Sample data for the prototype.
// Persona: Aanya & Rohan, couple, vegetarian Indian, high-protein, weight management.

const PROFILE = {
  household: "Aanya & Rohan",
  servings: 2,
  goalKcal: 1900,
  goalProtein: 110,
  diet: "Vegetarian",
  cuisines: ["North Indian", "South Indian"],
  emphasis: ["High protein", "Low sugar"],
};

const DAYS = [
  { name: "Monday", short: "Mon", date: "May 19" },
  { name: "Tuesday", short: "Tue", date: "May 20" },
  { name: "Wednesday", short: "Wed", date: "May 21" },
  { name: "Thursday", short: "Thu", date: "May 22" },
  { name: "Friday", short: "Fri", date: "May 23" },
  { name: "Saturday", short: "Sat", date: "May 24" },
  { name: "Sunday", short: "Sun", date: "May 25" },
];

// Today (for highlighting) — Tuesday
const TODAY_INDEX = 1;

const MEALS = {
  poha: { id: "poha", name: "Veg Poha with Peanuts", glyph: "Rice", tone: "saffron", kcal: 380, p: 12, c: 58, fat: 11, sugar: 4, fiber: 5, time: 15 },
  besan_chilla: { id: "besan_chilla", name: "Besan Chilla, Mint Chutney", glyph: "Roti", tone: "saffron", kcal: 410, p: 22, c: 38, fat: 14, sugar: 3, fiber: 7, time: 20 },
  paneer_bhurji: { id: "paneer_bhurji", name: "Paneer Bhurji + Multigrain Roti", glyph: "Cube", tone: "paprika", kcal: 540, p: 34, c: 42, fat: 22, sugar: 5, fiber: 8, time: 25 },
  rajma: { id: "rajma", name: "Rajma Chawal (Brown Rice)", glyph: "Bowl", tone: "paprika", kcal: 620, p: 26, c: 92, fat: 12, sugar: 6, fiber: 14, time: 35 },
  chana: { id: "chana", name: "Chana Masala + Quinoa", glyph: "Bowl", tone: "paprika", kcal: 580, p: 28, c: 76, fat: 14, sugar: 7, fiber: 13, time: 30 },
  khichdi: { id: "khichdi", name: "Moong Dal Khichdi, Curd", glyph: "Rice", tone: "saffron", kcal: 510, p: 22, c: 78, fat: 10, sugar: 5, fiber: 9, time: 25 },
  tofu_tikka: { id: "tofu_tikka", name: "Tofu Tikka + Brown Rice", glyph: "Cube", tone: "paprika", kcal: 590, p: 38, c: 60, fat: 18, sugar: 4, fiber: 8, time: 30 },
  palak_paneer: { id: "palak_paneer", name: "Palak Paneer + Jowar Roti", glyph: "Leaf", tone: "olive", kcal: 560, p: 30, c: 44, fat: 24, sugar: 5, fiber: 9, time: 30 },
  sprouts: { id: "sprouts", name: "Sprouted Moth Bean Salad", glyph: "Leaf", tone: "olive", kcal: 260, p: 14, c: 38, fat: 4, sugar: 6, fiber: 11, time: 10 },
  curd_rice: { id: "curd_rice", name: "Curd Rice with Tempering", glyph: "Rice", tone: "saffron", kcal: 340, p: 12, c: 56, fat: 8, sugar: 4, fiber: 3, time: 15 },
  thepla: { id: "thepla", name: "Methi Thepla + Yoghurt", glyph: "Roti", tone: "saffron", kcal: 380, p: 14, c: 48, fat: 14, sugar: 3, fiber: 6, time: 20 },
  idli: { id: "idli", name: "Idli, Sambar, Coconut Chutney", glyph: "Dome", tone: "olive", kcal: 440, p: 18, c: 72, fat: 8, sugar: 5, fiber: 8, time: 25 },
  upma: { id: "upma", name: "Vegetable Rava Upma", glyph: "Bowl", tone: "saffron", kcal: 360, p: 11, c: 56, fat: 10, sugar: 4, fiber: 5, time: 20 },
  pesarattu: { id: "pesarattu", name: "Pesarattu, Ginger Chutney", glyph: "Roti", tone: "olive", kcal: 420, p: 24, c: 50, fat: 10, sugar: 3, fiber: 9, time: 25 },
  soya: { id: "soya", name: "Soya Chunk Curry + Rice", glyph: "Pot", tone: "paprika", kcal: 560, p: 36, c: 64, fat: 14, sugar: 6, fiber: 10, time: 35 },
  dal_tadka: { id: "dal_tadka", name: "Mixed Dal Tadka + Roti", glyph: "Bowl", tone: "paprika", kcal: 480, p: 24, c: 58, fat: 12, sugar: 4, fiber: 11, time: 30 },
  smoothie: { id: "smoothie", name: "Banana Almond Smoothie", glyph: "Glass", tone: "saffron", kcal: 280, p: 10, c: 38, fat: 8, sugar: 18, fiber: 4, time: 5 },
  fruit: { id: "fruit", name: "Fruit Bowl + Greek Yoghurt", glyph: "Glass", tone: "olive", kcal: 220, p: 12, c: 30, fat: 5, sugar: 22, fiber: 5, time: 5 },
  buttermilk: { id: "buttermilk", name: "Spiced Buttermilk", glyph: "Glass", tone: "olive", kcal: 80, p: 4, c: 8, fat: 3, sugar: 5, fiber: 0, time: 3 },
  trail: { id: "trail", name: "Roasted Chana + Almonds", glyph: "Cube", tone: "saffron", kcal: 180, p: 9, c: 18, fat: 8, sugar: 1, fiber: 4, time: 0 },
};

// Plan: [{ breakfast, lunch, snack, dinner }] per day
const PLAN = [
  { breakfast: "besan_chilla", lunch: "paneer_bhurji", snack: "trail", dinner: "rajma", leftover: null },
  { breakfast: "poha", lunch: "chana", snack: "buttermilk", dinner: "tofu_tikka", leftover: "rajma" },
  { breakfast: "idli", lunch: "khichdi", snack: "fruit", dinner: "palak_paneer", leftover: null },
  { breakfast: "thepla", lunch: "sprouts", snack: "trail", dinner: "soya", leftover: null },
  { breakfast: "smoothie", lunch: "curd_rice", snack: "buttermilk", dinner: "dal_tadka", leftover: null },
  { breakfast: "upma", lunch: "pesarattu", snack: "fruit", dinner: "tofu_tikka", leftover: null },
  { breakfast: "besan_chilla", lunch: "chana", snack: "trail", dinner: "palak_paneer", leftover: "chana" },
];

// Recipe shown in detail view
const RECIPE = {
  id: "paneer_bhurji",
  name: "Paneer Bhurji + Multigrain Roti",
  subtitle: "Scrambled paneer, onions and peppers — fast, protein-dense, easy to scale.",
  servings: 2,
  time: 25,
  difficulty: "Easy",
  tags: ["High protein", "Vegetarian", "North Indian", "Under 30 min"],
  nutrition: { kcal: 540, p: 34, c: 42, fat: 22, sugar: 5, fiber: 8 },
  ingredients: [
    { name: "Paneer, crumbled", amt: "9 oz" },
    { name: "Onion, finely chopped", amt: "1 medium" },
    { name: "Tomato, finely chopped", amt: "1 medium" },
    { name: "Bell pepper, diced", amt: "½ green" },
    { name: "Green chillies, slit", amt: "2" },
    { name: "Ginger, grated", amt: "1 tsp" },
    { name: "Cumin seeds", amt: "1 tsp" },
    { name: "Turmeric", amt: "¼ tsp" },
    { name: "Garam masala", amt: "½ tsp" },
    { name: "Cilantro, chopped", amt: "2 tbsp" },
    { name: "Multigrain flour", amt: "1 cup" },
    { name: "Ghee", amt: "1 tbsp" },
  ],
  steps: [
    "Knead the multigrain dough with warm water and a pinch of salt. Rest covered for 10 minutes while you prep the bhurji.",
    "Heat ghee in a wide pan, splutter cumin seeds, then add ginger and green chillies. Sauté 30 seconds.",
    "Add onion and cook until edges turn golden, about 3–4 minutes. Stir in capsicum and cook 2 minutes more.",
    "Add tomato, turmeric and a pinch of salt. Cook until tomatoes break down and oil separates.",
    "Fold in the crumbled paneer and toss gently — you want streaks of yellow, not a paste. Cook 2 minutes.",
    "Finish with garam masala and coriander. Roll and roast 4 rotis on a hot tawa, brush with a touch of ghee.",
  ],
  pairsWith: ["khichdi", "buttermilk"],
};

// Grocery list — aggregated for the week
const GROCERY = [
  {
    section: "Produce",
    items: [
      { name: "Yellow onion", qty: "8" },
      { name: "Tomato", qty: "10" },
      { name: "Bell pepper, green", qty: "3" },
      { name: "Bell pepper, red", qty: "2" },
      { name: "Spinach", qty: "1 lb" },
      { name: "Fenugreek leaves (methi)", qty: "1 bunch" },
      { name: "Cilantro", qty: "2 bunches" },
      { name: "Mint", qty: "1 bunch" },
      { name: "Ginger", qty: "4 oz" },
      { name: "Garlic", qty: "1 head" },
      { name: "Green chili", qty: "12" },
      { name: "Lemon", qty: "4" },
      { name: "Banana", qty: "6" },
      { name: "Apple", qty: "4" },
    ],
  },
  {
    section: "Dairy & Protein",
    items: [
      { name: "Paneer", qty: "1 lb" },
      { name: "Tofu, firm", qty: "14 oz" },
      { name: "Plain yogurt", qty: "32 oz" },
      { name: "Greek yogurt", qty: "17 oz" },
      { name: "Milk", qty: "½ gallon" },
      { name: "Soy chunks", qty: "7 oz" },
    ],
  },
  {
    section: "Pantry & Grains",
    items: [
      { name: "Brown rice", qty: "2 lb" },
      { name: "Quinoa", qty: "11 oz" },
      { name: "Multigrain flour", qty: "4 lb" },
      { name: "Sorghum (jowar) flour", qty: "1 lb" },
      { name: "Chickpea flour (besan)", qty: "1 lb" },
      { name: "Kidney beans, dried", qty: "11 oz" },
      { name: "Chickpeas, dried", qty: "11 oz" },
      { name: "Yellow moong dal", qty: "11 oz" },
      { name: "Toor dal", qty: "9 oz" },
      { name: "Moth beans (for sprouting)", qty: "7 oz" },
      { name: "Flattened rice (poha)", qty: "9 oz" },
      { name: "Semolina (rava)", qty: "11 oz" },
      { name: "Idli rava", qty: "11 oz" },
    ],
  },
  {
    section: "Spices & Oils",
    items: [
      { name: "Cumin seeds", qty: "✓ check" },
      { name: "Mustard seeds", qty: "✓ check" },
      { name: "Turmeric", qty: "✓ check" },
      { name: "Garam masala", qty: "✓ check" },
      { name: "Ghee", qty: "7 oz" },
      { name: "Avocado oil", qty: "17 fl oz" },
    ],
  },
];

window.PROFILE = PROFILE;
window.DAYS = DAYS;
window.TODAY_INDEX = TODAY_INDEX;
window.MEALS = MEALS;
window.PLAN = PLAN;
window.RECIPE = RECIPE;
window.GROCERY = GROCERY;
