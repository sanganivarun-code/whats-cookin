# What's Cookin'?

A weekly meal planner that builds a personalised, macro-balanced week of meals and one tidy grocery list to shop from. Tell it your goals, dietary preferences, and household size — it handles the rest.

> **Claude Design reference** — the original prototype lives in `project/`. Do not edit that folder. It is the visual source of truth used to guide the production app in `src/`.

---

## Prerequisites

- Node.js 20 or later
- npm 10 or later

---

## Setup

```bash
npm install
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server at http://localhost:5173 |
| `npm run build` | Type-check then compile to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Run tests in watch mode (re-runs on save) |
| `npm run test:run` | Run tests once — use this in CI or to verify a change |
| `npm run test:coverage` | Run tests once and write a coverage report to `coverage/` |

---

## Project structure

```
src/
  types/        TypeScript interfaces for all data shapes
  data/         Static mock data (typed against those interfaces)
  utils/        Pure functions — meal plan, grocery, and nutrition logic
  store/        React context — shared app state
  components/   Reusable UI primitives (icons, nav, shared chrome)
  screens/      One file or folder per route
  overlays/     App-wide modals (auth modal, meal edit sheet)
  __tests__/    Unit and component tests

project/        Claude Design prototype — reference only, do not edit
```

---

## Future backend notes

These integration points are marked with `// FUTURE:` comments in the source so they are easy to find when the time comes.

| Area | File | Notes |
|---|---|---|
| Meal plan generation | `src/utils/mealPlan.ts` | Currently returns static mock data. A Gemini API call will replace the generation stub here. No API keys or SDK should be added until this is intentional. |
| Grocery aggregation | `src/utils/grocery.ts` | Currently aggregates the static `GROCERY` constant. A server-side endpoint may replace this once plans are generated dynamically. |
| Authentication | `src/store/StoreContext.tsx` | The `signedIn` flag is purely in-memory today. Supabase or Firebase auth wires in here. |
| Persistence | `src/store/StoreContext.tsx` | `favorites`, `overrides`, `groceryTags`, and `pantryHave` are all in-memory. They will sync to a database once auth exists. |

No environment variables, secrets, API keys, or backend dependencies exist in this repository today.
