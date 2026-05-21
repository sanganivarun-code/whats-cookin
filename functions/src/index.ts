// Firebase Function: generateMealPlan
//
// Authenticated HTTPS Callable. Only signed-in users may call it.
//
// Flow:
//   1. Validate auth and payload shape
//   2. Check per-user daily rate limit (5 successful generations / day)
//   3. Call Gemini (gemini-2.5-flash-lite by default)
//   4. Validate response structure
//   5. If validation fails, retry once with the fallback model (gemini-2.5-flash)
//   6. If both attempts fail, throw — frontend falls back to local generation
//   7. Increment rate-limit counter only on success
//
// Secret:
//   GEMINI_API_KEY — set via: firebase functions:secrets:set GEMINI_API_KEY
//   Never logged, never returned to the client.
//
// Model config (non-sensitive, in functions/.env):
//   DEFAULT_GEMINI_MODEL=gemini-2.5-flash-lite
//   FALLBACK_GEMINI_MODEL=gemini-2.5-flash

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { GoogleGenAI } from '@google/genai'

admin.initializeApp()
const db = admin.firestore()

const PROJECT_ID     = process.env['GCLOUD_PROJECT'] ?? ''
const LOCATION       = 'us-central1'
const DEFAULT_MODEL  = process.env['DEFAULT_GEMINI_MODEL']  ?? 'gemini-2.5-flash-lite'
const FALLBACK_MODEL = process.env['FALLBACK_GEMINI_MODEL'] ?? 'gemini-2.5-flash'
const DAILY_CAP      = 5

// ─── Payload type ──────────────────────────────────────────────────────────────
// Mirrors the frontend OnboardingState. Validated loosely here; the prompt
// itself is the primary guard against bad input.

interface OnboardingPayload {
  diet:      string
  cuisines:  string[]
  emphasis:  string[]
  household: number
  goalKcal:  number
  cookTime:  number
  batch:     number
  allergies: string
  fitness?:  string
}

// ─── Response types ────────────────────────────────────────────────────────────

interface GeminiMeal {
  id:    string
  name:  string
  glyph: string
  tone:  string
  kcal:  number
  p:     number
  c:     number
  fat:   number
  sugar: number
  fiber: number
  time:  number
}

interface GeminiRecipe {
  id:          string
  name:        string
  subtitle:    string
  servings:    number
  time:        number
  difficulty:  string
  tags:        string[]
  nutrition:   { kcal: number; p: number; c: number; fat: number; sugar: number; fiber: number }
  ingredients: Array<{ name: string; amt: string }>
  steps:       string[]
  pairsWith:   string[]
}

interface GeminiDayPlan {
  breakfast: string
  lunch:     string
  snack:     string
  dinner:    string
  leftover:  string | null
}

export interface GeminiPlanResponse {
  days:         GeminiDayPlan[]
  meals:        Record<string, GeminiMeal>
  recipes:      Record<string, GeminiRecipe>
  groceryItems: Array<{ section: string; name: string; qty: string }>
}

// ─── Prompt ────────────────────────────────────────────────────────────────────

function dietNote(diet: string): string {
  switch (diet) {
    case 'Vegan':          return 'no meat, fish, dairy, or eggs'
    case 'Vegetarian':     return 'no meat or fish; dairy and eggs permitted'
    case 'Eggetarian':     return 'no meat or fish; eggs and dairy permitted'
    case 'Pescatarian':    return 'fish permitted; no other meat'
    default:               return 'all foods permitted'
  }
}

function buildPrompt(s: OnboardingPayload): string {
  const batchNote = s.batch > 0
    ? `For days at index 1 through ${Math.min(s.batch, 6)}, set leftover to the previous day's dinner meal ID. All other days must have leftover set to null.`
    : 'Set leftover to null for every day.'

  return `You are an expert meal-planning assistant. Generate a complete, personalised 7-day meal plan.

User preferences:
- Dietary line: ${s.diet} (${dietNote(s.diet)})
- Preferred cuisines: ${s.cuisines.length ? s.cuisines.join(', ') : 'any'}
- Health emphasis: ${s.emphasis.length ? s.emphasis.join(', ') : 'none'}
- Fitness goal: ${s.fitness ?? 'maintain'}
- Daily calorie target: ${s.goalKcal} kcal per person
- Max cook time per meal: ${s.cookTime} minutes
- Household size: ${s.household} adult(s)
- Allergies / foods to avoid: ${s.allergies || 'none'}
- Batch cooking: ${batchNote}

Rules you must follow exactly:
1. Return exactly 7 day objects. Index 0 = Monday, index 6 = Sunday.
2. Each day must have breakfast, lunch, snack, and dinner — all referencing meal IDs defined in the meals map.
3. Total daily calories across all four meals should be close to ${s.goalKcal} kcal per person.
4. Strictly exclude every listed allergen — no exceptions.
5. No single meal's cook time may exceed ${s.cookTime} minutes. Snacks should be fast (under 10 minutes).
6. Every meal ID must be unique, lowercase, and use underscores (e.g. lemon_dal_rice, avocado_toast).
7. The glyph field of each meal must be exactly one of: Bowl, Roti, Glass, Leaf, Stack, Dome, Pot, Rice, Cube
8. The tone field of each meal must be exactly one of: paprika, saffron, olive, ink
9. Every meal ID referenced in the days array must have a complete entry in the meals array (matched by the id field).
10. Every meal ID in the meals array must have a complete recipe entry in the recipes array (matched by the id field).
11. Grocery items must be grouped into clearly labelled sections such as Produce, Dairy, Grains, Pantry, Protein, Spices.
12. Grocery item names must be plain ingredient names only — no preparation methods (chopped, sliced, diced, grated, minced, etc.) and no descriptors after a comma. Write "Onion" not "Onion, finely chopped".
13. Recipes must include: a subtitle, estimated servings, difficulty (Easy/Medium/Hard), relevant tags, full ingredient list with quantities, and clear numbered step-by-step instructions.
14. Each ingredient must have a category field — one of: Produce, Dairy & Protein, Grains & Bread, Spices & Oils, Pantry, Other.
15. Ingredient names must use the format "[Full Name] - [Prep Method]" when a preparation method applies. Use a dash separator, never a comma. Examples: "Red Onion - Thinly Sliced", "Cherry Tomatoes - Halved", "Paneer - Crumbled". Plain ingredients with no prep: just the name, e.g. "Olive Oil", "Salt".`
}

// ─── Response schema ───────────────────────────────────────────────────────────
// Passed to Gemini as responseSchema for structured JSON output.
// Gemini uses an OpenAPI-compatible subset of JSON Schema.

const RESPONSE_SCHEMA = {
  type: 'object',
  required: ['days', 'meals', 'recipes', 'groceryItems'],
  properties: {
    days: {
      type: 'array',
      minItems: 7,
      maxItems: 7,
      items: {
        type: 'object',
        required: ['breakfast', 'lunch', 'snack', 'dinner', 'leftover'],
        properties: {
          breakfast: { type: 'string' },
          lunch:     { type: 'string' },
          snack:     { type: 'string' },
          dinner:    { type: 'string' },
          leftover:  { type: 'string', nullable: true },
        },
      },
    },
    meals: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'glyph', 'tone', 'kcal', 'p', 'c', 'fat', 'sugar', 'fiber', 'time'],
        properties: {
          id:    { type: 'string' },
          name:  { type: 'string' },
          glyph: { type: 'string', enum: ['Bowl', 'Roti', 'Glass', 'Leaf', 'Stack', 'Dome', 'Pot', 'Rice', 'Cube'] },
          tone:  { type: 'string', enum: ['paprika', 'saffron', 'olive', 'ink'] },
          kcal:  { type: 'number' },
          p:     { type: 'number' },
          c:     { type: 'number' },
          fat:   { type: 'number' },
          sugar: { type: 'number' },
          fiber: { type: 'number' },
          time:  { type: 'number' },
        },
      },
    },
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'subtitle', 'servings', 'time', 'difficulty', 'tags', 'nutrition', 'ingredients', 'steps', 'pairsWith'],
        properties: {
          id:         { type: 'string' },
          name:       { type: 'string' },
          subtitle:   { type: 'string' },
          servings:   { type: 'number' },
          time:       { type: 'number' },
          difficulty: { type: 'string' },
          tags:       { type: 'array', items: { type: 'string' } },
          nutrition: {
            type: 'object',
            required: ['kcal', 'p', 'c', 'fat', 'sugar', 'fiber'],
            properties: {
              kcal:  { type: 'number' },
              p:     { type: 'number' },
              c:     { type: 'number' },
              fat:   { type: 'number' },
              sugar: { type: 'number' },
              fiber: { type: 'number' },
            },
          },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'amt', 'category'],
              properties: {
                name:     { type: 'string' },
                amt:      { type: 'string' },
                category: { type: 'string', enum: ['Produce', 'Dairy & Protein', 'Grains & Bread', 'Spices & Oils', 'Pantry', 'Other'] },
              },
            },
          },
          steps:     { type: 'array', items: { type: 'string' } },
          pairsWith: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    groceryItems: {
      type: 'array',
      items: {
        type: 'object',
        required: ['section', 'name', 'qty'],
        properties: {
          section: { type: 'string' },
          name:    { type: 'string' },
          qty:     { type: 'string' },
        },
      },
    },
  },
}

// ─── Server-side validation ────────────────────────────────────────────────────
// Lighter-weight than the frontend validator. Confirms the shape is usable
// before incrementing the rate-limit counter or returning to the caller.

const SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'] as const
const NUM_FIELDS = ['kcal', 'p', 'c', 'fat', 'sugar', 'fiber', 'time'] as const

function validateOutput(raw: unknown): GeminiPlanResponse | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>

  // Validate days
  if (!Array.isArray(d['days']) || d['days'].length !== 7) return null
  const mealIds = new Set<string>()
  for (const day of d['days'] as unknown[]) {
    if (!day || typeof day !== 'object') return null
    const entry = day as Record<string, unknown>
    for (const slot of SLOTS) {
      if (typeof entry[slot] !== 'string' || !(entry[slot] as string)) return null
      mealIds.add(entry[slot] as string)
    }
    const lo = entry['leftover']
    if (lo !== null && typeof lo !== 'string') return null
    if (typeof lo === 'string' && lo) mealIds.add(lo)
  }

  // Convert meals array → record keyed by id
  if (!Array.isArray(d['meals'])) return null
  const meals: Record<string, unknown> = {}
  for (const item of d['meals'] as unknown[]) {
    if (!item || typeof item !== 'object') return null
    const m = item as Record<string, unknown>
    if (typeof m['id'] !== 'string' || !m['id']) return null
    meals[m['id'] as string] = m
  }

  // Every referenced meal ID must exist with required numeric fields
  for (const id of mealIds) {
    const meal = meals[id]
    if (!meal || typeof meal !== 'object') return null
    const m = meal as Record<string, unknown>
    if (typeof m['name'] !== 'string' || !m['name']) return null
    for (const field of NUM_FIELDS) {
      if (typeof m[field] !== 'number' || !isFinite(m[field] as number)) return null
    }
  }

  // Convert recipes array → record keyed by id
  if (!Array.isArray(d['recipes'])) return null
  const recipes: Record<string, unknown> = {}
  for (const item of d['recipes'] as unknown[]) {
    if (!item || typeof item !== 'object') return null
    const r = item as Record<string, unknown>
    if (typeof r['id'] !== 'string' || !r['id']) return null
    recipes[r['id'] as string] = r
  }

  // Every meal ID referenced in days must have a recipe with matching ID.
  // Rejects responses where Gemini uses a different ID for a recipe than its meal.
  for (const id of mealIds) {
    if (!recipes[id]) return null
  }

  // Validate groceryItems exists (contents validated loosely)
  if (!Array.isArray(d['groceryItems'])) return null

  // Return with arrays converted to records
  return { ...d, meals, recipes } as unknown as GeminiPlanResponse
}

// ─── Gemini call ───────────────────────────────────────────────────────────────

async function callGemini(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
): Promise<GeminiPlanResponse | null> {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })
    const text = response.text
    if (!text) { console.error(`[callGemini] ${model}: empty response text`); return null }
    const parsed: unknown = JSON.parse(text)
    const validated = validateOutput(parsed)
    if (!validated) console.error(`[callGemini] ${model}: response failed validation`, JSON.stringify(parsed).slice(0, 2000))
    return validated
  } catch (err) {
    console.error(`[callGemini] ${model}: threw`, err)
    return null
  }
}

// ─── Rate limiting ─────────────────────────────────────────────────────────────
// Stored at: users/{uid}/rateLimits/generation
// Shape: { date: 'YYYY-MM-DD', count: number }
// Resets automatically when the date changes (new UTC day).

async function checkRateLimit(uid: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const ref = db.doc(`users/${uid}/rateLimits/generation`)
  const snap = await ref.get()
  const data = snap.data() ?? {}
  const count = data['date'] === today ? (data['count'] as number ?? 0) : 0
  if (count >= DAILY_CAP) {
    throw new HttpsError(
      'resource-exhausted',
      `You've reached your daily limit of ${DAILY_CAP} AI-generated plans. The app will use local generation instead. Try again tomorrow.`,
    )
  }
}

async function incrementRateLimit(uid: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const ref = db.doc(`users/${uid}/rateLimits/generation`)
  const snap = await ref.get()
  const data = snap.data() ?? {}
  const newCount = data['date'] === today ? (data['count'] as number ?? 0) + 1 : 1
  await ref.set({ date: today, count: newCount })
}

// ─── Exported function ─────────────────────────────────────────────────────────

export const generateMealPlan = onCall(
  { maxInstances: 10, cors: true, timeoutSeconds: 300 },
  async (request): Promise<GeminiPlanResponse> => {
    // 1. Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to generate a meal plan.')
    }
    const uid = request.auth.uid

    // 2. Payload validation
    const payload = request.data as Partial<OnboardingPayload>
    if (
      !payload ||
      typeof payload.diet !== 'string' ||
      !Array.isArray(payload.cuisines) ||
      typeof payload.goalKcal !== 'number'
    ) {
      throw new HttpsError('invalid-argument', 'Invalid or incomplete onboarding data.')
    }

    // 3. Rate limit check (throws HttpsError if exceeded)
    await checkRateLimit(uid)

    // 4. Build prompt and create Gemini client (Vertex AI — bills to Cloud project)
    const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION })
    const prompt = buildPrompt(payload as OnboardingPayload)

    // 5. Attempt 1 — default model (flash-lite)
    let result = await callGemini(ai, DEFAULT_MODEL, prompt)

    // 6. Attempt 2 — fallback model (flash), only when first response is invalid
    if (!result) {
      result = await callGemini(ai, FALLBACK_MODEL, prompt)
    }

    // 7. Both attempts failed — do NOT increment rate limit
    if (!result) {
      throw new HttpsError(
        'internal',
        'AI generation failed to produce a valid meal plan. The app will use local generation instead.',
      )
    }

    // 8. Increment counter only on success
    await incrementRateLimit(uid)

    return result
  },
)
