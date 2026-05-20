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

## AI meal generation (Gemini via Firebase Functions)

The AI plan generation feature calls Gemini through a Firebase Cloud Function so the API key stays server-side. This requires a few one-time steps.

**Billing:** Firebase Functions (v2) requires the **Blaze (pay-as-you-go)** plan. Enable it in the Firebase console under *Upgrade project*. Gemini API calls via this app are low-volume; the free tier of Cloud Functions covers most development usage.

**Deploy the function:**

```bash
# 1. Install function dependencies
cd functions && npm install && npm run build && cd ..

# 2. Store your Gemini API key in Secret Manager (never in code or .env.local)
firebase secrets:set GEMINI_API_KEY
# Paste your key when prompted — it is stored encrypted in Google Cloud Secret Manager

# 3. Update .firebaserc with your real project ID, then deploy
firebase deploy --only functions
```

**Local emulation (optional):**

```bash
firebase emulators:start --only functions
```

When running against the emulator, the frontend's `VITE_FIREBASE_FUNCTIONS_REGION` must match the emulator's region. See `.env.local.example` for the variable name.

**Without the function:** The app degrades gracefully — plans are generated locally with the deterministic generator and a banner is shown on the Dashboard.

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

## Backend integration points

| Area | Status | Notes |
|---|---|---|
| Meal plan generation | Live (Gemini) | `functions/src/index.ts` — `generateMealPlan` callable. Falls back to local generator when unavailable. |
| Authentication | Live (Firebase Auth) | Google sign-in via popup. Signed-out users get the full local experience. |
| Cloud persistence | Live (Firestore) | Plans, favorites saved to Firestore. Manual save — user clicks "Save plan" from Dashboard. |
| Grocery aggregation | Static | Aggregates `src/data/grocery.ts` for local plans; uses `runtimeGrocery` returned by Gemini for AI plans. |
