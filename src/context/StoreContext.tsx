import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { StoreState, Override, OverrideMap, AppUser, EditTarget } from '../types/store'
import type { GroceryTagMap, PantryMap, GroceryEditMap, GroceryAdditionsMap, GroceryEdit } from '../types/grocery'
import type { MealSlot, MealPlan, Meal, Recipe } from '../types/meal'
import type { OnboardingState, UserProfile } from '../types/profile'
import { firebaseServices } from '../lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth'
import {
  saveExtendedPlan, loadLatestExtendedPlan,
  saveFavorite, removeFavorite, loadFavorites,
} from '../lib/firestoreSync'
import { mergeFavorites } from '../utils/favorites'
import type { PlanSource, FavoriteRecord, FavoriteSource } from '../lib/firestoreSync'
import { callGenerateMealPlan } from '../lib/geminiClient'
import { MEALS } from '../data/meals'

const StoreContext = createContext<StoreState | null>(null)

export function useStore(): StoreState {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false)
  // True until onAuthStateChanged fires for the first time. Prevents the sign-in
  // button from flashing before Firebase confirms the user's session.
  const [authLoading, setAuthLoading] = useState(!!firebaseServices)
  const [user, setUser] = useState<AppUser>({
    name:    'Aanya Sharma',
    initial: 'A',
    email:   'aanya@cookin.test',
  })
  const [favorites, setFavoritesState] = useState<Set<string>>(new Set())
  const [favoriteRecords, setFavoriteRecords] = useState<Map<string, FavoriteRecord>>(new Map())
  const favoritesRef = useRef<Set<string>>(new Set())

  // Keeps favoritesRef in sync so onAuthStateChanged can read temp favorites
  // accumulated while signed out without stale-closure issues.
  const setFavorites = (next: Set<string>) => {
    favoritesRef.current = next
    setFavoritesState(next)
  }
  const [overrides, setOverrides] = useState<OverrideMap>({})
  const [authOpen, setAuthOpen] = useState(false)
  const [planSaved, setPlanSaved] = useState(false)
  const [planDirty, setPlanDirty] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recipeTarget, setRecipeTarget] = useState<string | null>(null)

  // Internal state setter; public API goes through the setGeneratedPlan wrapper
  // which also keeps the ref in sync.
  const [generatedPlan, setGeneratedPlanState] = useState<MealPlan | null>(null)

  // Ref mirrors generatedPlan so the onAuthStateChanged callback always sees
  // the current value without needing to re-subscribe on every state change.
  const generatedPlanRef = useRef<MealPlan | null>(null)

  // AI generation state
  const [planSource, setPlanSource] = useState<PlanSource | null>(null)
  const [generationLoading, setGenerationLoading] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Runtime data populated by a successful Gemini generation.
  // Empty for sample/local-dev-fallback plans, which fall back to static MEALS / RECIPE.
  const [runtimeMeals,   setRuntimeMeals]   = useState<Record<string, Meal>>({})
  const [runtimeRecipes, setRuntimeRecipes] = useState<Record<string, Recipe>>({})
  const [runtimeGrocery, setRuntimeGrocery] = useState<Array<{ section: string; name: string; qty: string }>>([])

  const [groceryTags, setGroceryTags] = useState<GroceryTagMap>({
    'Paneer':                    'Indian Grocery',
    'Yellow moong dal':          'Indian Grocery',
    'Chickpea flour (besan)':    'Indian Grocery',
    'Sorghum (jowar) flour':     'Indian Grocery',
    'Idli rava':                 'Indian Grocery',
    'Ghee':                      'Indian Grocery',
    'Tofu, firm':                "Trader Joe's",
    'Greek yogurt':              "Trader Joe's",
    'Plain yogurt':              "Trader Joe's",
    'Brown rice':                'Costco',
    'Quinoa':                    'Costco',
    'Milk':                      'Costco',
    'Spinach':                   'Farmers Market',
    'Cilantro':                  'Farmers Market',
    'Mint':                      'Farmers Market',
    'Banana':                    'Farmers Market',
    'Apple':                     'Farmers Market',
    'Lemon':                     'Farmers Market',
  })

  const [pantryHave, setPantryHave] = useState<PantryMap>({})
  const [groceryEdits, setGroceryEdits] = useState<GroceryEditMap>({})
  const [groceryAdditions, setGroceryAdditions] = useState<GroceryAdditionsMap>({})

  // ─── Firebase auth subscription ────────────────────────────────────────────
  // Runs once on mount. State setters from useState are stable across renders
  // so the empty dependency array is safe.

  useEffect(() => {
    if (!firebaseServices) return

    const { auth, db } = firebaseServices

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setSignedIn(false)
        setPlanSaved(false)
        setPlanDirty(false)
        setSaveError(null)
        setFavorites(new Set())
        setFavoriteRecords(new Map())
        setAuthLoading(false)
        return
      }

      // Load remote data in parallel, then update state
      void (async () => {
        try {
          const [remoteFavs, remoteExtended] = await Promise.all([
            loadFavorites(db, fbUser.uid),
            // Only fetch remote plan when there is no locally generated plan
            generatedPlanRef.current === null
              ? loadLatestExtendedPlan(db, fbUser.uid)
              : Promise.resolve(null),
          ])

          // Merge temp (signed-out) favorites with remote records, then push
          // local-only IDs to Firestore with full snapshots. Failures are logged
          // but don't block auth flow completion.
          const remoteIds = new Set(remoteFavs.keys())
          const { merged: mergedIds, toSave } = mergeFavorites(favoritesRef.current, remoteIds)

          // Resolve snapshots for merged records. Temp favorites while signed-out
          // always come from the static MEALS library (Gemini requires auth).
          const resolveMeal = (id: string) =>
            remoteExtended?.runtimeMeals[id] ?? MEALS[id]

          const mergedRecords = new Map<string, FavoriteRecord>()
          const toBackfill: FavoriteRecord[] = []

          for (const id of mergedIds) {
            if (remoteFavs.has(id)) {
              const record = remoteFavs.get(id)!
              if (!record.snapshot) {
                const meal = resolveMeal(id)
                if (meal) {
                  const backfilled: FavoriteRecord = {
                    ...record,
                    source: id in MEALS ? 'sample' : 'gemini',
                    snapshot: meal,
                  }
                  mergedRecords.set(id, backfilled)
                  toBackfill.push(backfilled)
                } else {
                  mergedRecords.set(id, record)
                }
              } else {
                mergedRecords.set(id, record)
              }
            } else {
              // Local-only temp favorite — build a record with snapshot
              const meal = resolveMeal(id)
              mergedRecords.set(id, {
                mealId: id,
                source: id in MEALS ? 'sample' : 'unknown',
                snapshot: meal,
              })
            }
          }

          setFavorites(mergedIds)
          setFavoriteRecords(mergedRecords)

          if (toSave.length > 0) {
            Promise.all(toSave.map(id => saveFavorite(db, fbUser.uid, mergedRecords.get(id)!)))
              .catch(err => console.error('Favorites merge save error', err))
          }
          if (toBackfill.length > 0) {
            Promise.all(toBackfill.map(r => saveFavorite(db, fbUser.uid, r)))
              .catch(err => console.error('Favorites backfill error', err))
          }

          if (remoteExtended) {
            // Remote plan found — restore it with its runtime meal/recipe/grocery data
            setGeneratedPlanState(remoteExtended.plan)
            generatedPlanRef.current = remoteExtended.plan
            setRuntimeMeals(remoteExtended.runtimeMeals)
            setRuntimeRecipes(remoteExtended.runtimeRecipes)
            setRuntimeGrocery(remoteExtended.runtimeGrocery)
            setPlanSource(remoteExtended.source)
            setOverrides(remoteExtended.overrides as OverrideMap)
            setPlanSaved(true)
            setPlanDirty(false)
          } else {
            // No remote plan. Local plan (if any) stays in state.
            // User must click Save explicitly — no auto-push to Firestore.
            setPlanSaved(false)
          }

          setUser({
            name:    fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'User',
            initial: (fbUser.displayName?.[0] ?? fbUser.email?.[0] ?? 'U').toUpperCase(),
            email:   fbUser.email ?? '',
          })
          setSignedIn(true)
          setAuthOpen(false)
        } catch (err) {
          console.error('Auth state sync error', err)
        } finally {
          setAuthLoading(false)
        }
      })()
    })

    return unsub
  }, []) // stable: firebaseServices is module-level, setters never change

  // ─── Auth actions ─────────────────────────────────────────────────────────

  const signIn = () => {
    if (!firebaseServices) {
      // Local-only fallback when Firebase is not configured
      setSignedIn(true)
      setAuthOpen(false)
      setPlanSaved(true)
      return
    }
    signInWithPopup(firebaseServices.auth, firebaseServices.googleProvider)
      .catch((err: unknown) => {
        const code = (err as { code?: string }).code
        // Popup closed by user — not an error worth logging
        if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
          console.error('Sign-in error', err)
        }
      })
    // State update is handled by onAuthStateChanged above
  }

  const signOut = () => {
    if (!firebaseServices) {
      setSignedIn(false)
      setPlanSaved(false)
      return
    }
    fbSignOut(firebaseServices.auth).catch(err => console.error('Sign-out error', err))
    // State update handled by onAuthStateChanged
  }

  // ─── Favorites (local + Firestore sync) ───────────────────────────────────

  const toggleFavorite = (mealId: string) => {
    const removing = favorites.has(mealId)
    const next = new Set(favorites)
    const nextRecords = new Map(favoriteRecords)

    if (removing) {
      next.delete(mealId)
      nextRecords.delete(mealId)
    } else {
      next.add(mealId)
      const meal   = runtimeMeals[mealId] ?? MEALS[mealId]
      const recipe = runtimeRecipes[mealId]
      const source: FavoriteSource =
        mealId in MEALS        ? 'sample' :
        mealId in runtimeMeals ? 'gemini' :
        'unknown'
      nextRecords.set(mealId, { mealId, source, snapshot: meal, recipeSnapshot: recipe })
    }

    setFavorites(next)
    setFavoriteRecords(nextRecords)

    if (firebaseServices) {
      const uid = firebaseServices.auth.currentUser?.uid
      if (uid) {
        if (removing) {
          removeFavorite(firebaseServices.db, uid, mealId).catch(console.error)
        } else {
          saveFavorite(firebaseServices.db, uid, nextRecords.get(mealId)!).catch(console.error)
        }
      }
    }
  }

  // ─── Meal overrides ───────────────────────────────────────────────────────

  const setOverride = (dayIndex: number, slot: MealSlot, value: Override | null) => {
    const key = `${dayIndex}_${slot}`
    setOverrides((prev) => {
      const next = { ...prev }
      if (value == null) delete next[key]
      else next[key] = value
      return next
    })
    // Sample-plan edits are session-only and never saveable; skip dirty flag.
    if (planSource !== 'sample') setPlanDirty(true)
  }

  const getOverride = (dayIndex: number, slot: MealSlot): Override | null =>
    overrides[`${dayIndex}_${slot}`] ?? null

  // ─── Generated plan (local + Firestore sync) ──────────────────────────────

  // Public setter: keeps the ref in sync alongside React state.
  // Does NOT auto-save to Firestore — user triggers save explicitly via Dashboard.
  const setGeneratedPlan = (plan: MealPlan) => {
    setGeneratedPlanState(plan)
    generatedPlanRef.current = plan
  }

  // Unified meal lookup: runtime (Gemini) meals first, then static MEALS.
  const getMeal = (id: string): Meal | undefined => runtimeMeals[id] ?? MEALS[id]

  // Unified recipe lookup: runtime recipes first, then a saved favorite recipeSnapshot.
  const getRecipe = (id: string): Recipe | undefined =>
    runtimeRecipes[id] ?? favoriteRecords.get(id)?.recipeSnapshot

  // Saves the current generated plan to Firestore. Called from Dashboard.
  // No-op when Firebase is not configured or no plan exists.
  const savePlanToCloud = (): void => {
    if (!firebaseServices || !generatedPlanRef.current) return
    const uid = firebaseServices.auth.currentUser?.uid
    if (!uid) return
    saveExtendedPlan(firebaseServices.db, uid, {
      plan:           generatedPlanRef.current,
      source:         planSource ?? 'local-dev-fallback',
      runtimeMeals:   planSource === 'gemini' ? runtimeMeals   : undefined,
      runtimeRecipes: planSource === 'gemini' ? runtimeRecipes : undefined,
      runtimeGrocery: planSource === 'gemini' ? runtimeGrocery : undefined,
      overrides,
    })
      .then(() => {
        setPlanSaved(true)
        setPlanDirty(false)
        setSaveError(null)
      })
      .catch(err => {
        console.error('Save plan error', err)
        setSaveError('Failed to save. Please try again.')
      })
  }

  // Starts async Gemini plan generation. Callers (Onboarding) must gate on auth
  // before calling. On Gemini failure, sets generationError and stops — does NOT
  // fall back to the local generator. The Loading screen handles retry/sample.
  const generatePlanAsync = (state: OnboardingState): void => {
    setGenerationLoading(true)
    setGenerationError(null)
    setOverrides({})
    setPlanDirty(false)
    setSaveError(null)

    void (async () => {
      try {
        if (signedIn && firebaseServices) {
          try {
            const response = await callGenerateMealPlan(state)
            setGeneratedPlanState(response.days as MealPlan)
            generatedPlanRef.current = response.days as MealPlan
            setRuntimeMeals(response.meals)
            setRuntimeRecipes(response.recipes)
            setRuntimeGrocery(response.groceryItems)
            setPlanSource('gemini')
            setPlanSaved(false)
            return
          } catch (err: unknown) {
            const code = (err as { code?: string }).code ?? ''
            const msg = code === 'functions/resource-exhausted'
              ? "You've reached your daily AI generation limit. Try again tomorrow, or view the sample plan."
              : 'AI generation is currently unavailable. Please try again or view the sample plan.'
            setGenerationError(msg)
            // Stop here — Loading screen offers retry or sample plan.
            return
          }
        }

        // Signed-out guard (Onboarding gates on auth, but handled defensively).
        // Do not call the local generator — switch to sample mode.
        setPlanSource('sample')
        setPlanSaved(false)
      } finally {
        setGenerationLoading(false)
      }
    })()
  }

  // Switches to sample-plan mode. Clears any loaded plan and runtime data so
  // Dashboard always falls back to the fixed static PLAN + MEALS constants.
  const viewSamplePlan = (): void => {
    setGenerationError(null)
    setPlanSource('sample')
    setGeneratedPlanState(null)
    generatedPlanRef.current = null
    setRuntimeMeals({})
    setRuntimeRecipes({})
    setRuntimeGrocery([])
    setOverrides({})
    setPlanSaved(false)
    setPlanDirty(false)
    setSaveError(null)
  }

  // ─── Grocery helpers ──────────────────────────────────────────────────────

  const setGroceryTag = (itemName: string, tag: string | null) => {
    setGroceryTags((prev) => {
      const next = { ...prev }
      if (tag) next[itemName] = tag
      else delete next[itemName]
      return next
    })
  }

  const setHave = (itemName: string, amount: number) => {
    setPantryHave((prev) => {
      const next = { ...prev }
      if (!amount) delete next[itemName]
      else next[itemName] = amount
      return next
    })
  }

  const setGroceryEdit = (originalName: string, edit: GroceryEdit | null) => {
    setGroceryEdits((prev) => {
      const next = { ...prev }
      if (!edit) delete next[originalName]
      else next[originalName] = { ...next[originalName], ...edit }
      return next
    })
  }

  const addGroceryItem = (section: string, name: string, qty: string) => {
    setGroceryAdditions((prev) => ({
      ...prev,
      [section]: [
        ...(prev[section] ?? []),
        {
          id: `add-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          qty,
          custom: true,
        },
      ],
    }))
  }

  const removeGroceryAddition = (section: string, id: string) => {
    setGroceryAdditions((prev) => ({
      ...prev,
      [section]: (prev[section] ?? []).filter((x) => x.id !== id),
    }))
  }

  const value: StoreState = {
    signedIn, authLoading, signIn, signOut, user,
    favorites, favoriteRecords, toggleFavorite,
    overrides, setOverride, getOverride,
    authOpen, setAuthOpen,
    planSaved, setPlanSaved, planDirty, saveError,
    editTarget, setEditTarget,
    groceryTags, setGroceryTag,
    pantryHave, setHave,
    groceryEdits, setGroceryEdit,
    groceryAdditions, addGroceryItem, removeGroceryAddition,
    onboardingState, setOnboardingState,
    profile, setProfile,
    recipeTarget, setRecipeTarget,
    generatedPlan, setGeneratedPlan,
    planSource, generationLoading, generationError,
    runtimeMeals, runtimeRecipes, runtimeGrocery,
    getMeal, getRecipe, generatePlanAsync, viewSamplePlan, savePlanToCloud,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
