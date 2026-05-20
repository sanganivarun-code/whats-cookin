import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { StoreState, Override, OverrideMap, AppUser, EditTarget } from '../types/store'
import type { GroceryTagMap, PantryMap, GroceryEditMap, GroceryAdditionsMap, GroceryEdit } from '../types/grocery'
import type { MealSlot, MealPlan } from '../types/meal'
import type { OnboardingState, UserProfile } from '../types/profile'
import { firebaseServices } from '../lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth'
import {
  savePlan, loadLatestPlan,
  saveFavorite, removeFavorite, loadFavorites,
} from '../lib/firestoreSync'

const StoreContext = createContext<StoreState | null>(null)

export function useStore(): StoreState {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false)
  const [user, setUser] = useState<AppUser>({
    name:    'Aanya Sharma',
    initial: 'A',
    email:   'aanya@cookin.test',
  })
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(['paneer_bhurji', 'khichdi'])
  )
  const [overrides, setOverrides] = useState<OverrideMap>({})
  const [authOpen, setAuthOpen] = useState(false)
  const [planSaved, setPlanSaved] = useState(false)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recipeTarget, setRecipeTarget] = useState<string | null>(null)

  // Internal state setter; public API goes through the setGeneratedPlan wrapper
  // which also keeps the ref and Firestore in sync.
  const [generatedPlan, setGeneratedPlanState] = useState<MealPlan | null>(null)

  // Ref mirrors generatedPlan so the onAuthStateChanged callback always sees
  // the current value without needing to re-subscribe on every state change.
  const generatedPlanRef = useRef<MealPlan | null>(null)

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
        return
      }

      // Load remote data in parallel, then update state
      void (async () => {
        try {
          const [remoteFavs, remotePlan] = await Promise.all([
            loadFavorites(db, fbUser.uid),
            // Only fetch remote plan when there is no locally generated plan
            generatedPlanRef.current === null
              ? loadLatestPlan(db, fbUser.uid)
              : Promise.resolve(null),
          ])

          // Merge remote favorites into local (union — never discard local picks)
          if (remoteFavs.size > 0) {
            setFavorites(prev => new Set([...prev, ...remoteFavs]))
          }

          if (remotePlan) {
            // Remote plan found and no local plan — restore the last saved plan
            setGeneratedPlanState(remotePlan)
            generatedPlanRef.current = remotePlan
          } else if (generatedPlanRef.current) {
            // Local plan exists — push it to Firestore so it is saved under this user
            savePlan(db, fbUser.uid, generatedPlanRef.current).catch(console.error)
          }

          setUser({
            name:    fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'User',
            initial: (fbUser.displayName?.[0] ?? fbUser.email?.[0] ?? 'U').toUpperCase(),
            email:   fbUser.email ?? '',
          })
          setSignedIn(true)
          setAuthOpen(false)
          setPlanSaved(true)
        } catch (err) {
          console.error('Auth state sync error', err)
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
    if (removing) next.delete(mealId)
    else next.add(mealId)
    setFavorites(next)

    if (firebaseServices) {
      const uid = firebaseServices.auth.currentUser?.uid
      if (uid) {
        if (removing) {
          removeFavorite(firebaseServices.db, uid, mealId).catch(console.error)
        } else {
          saveFavorite(firebaseServices.db, uid, mealId).catch(console.error)
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
  }

  const getOverride = (dayIndex: number, slot: MealSlot): Override | null =>
    overrides[`${dayIndex}_${slot}`] ?? null

  // ─── Generated plan (local + Firestore sync) ──────────────────────────────

  // Public setter: keeps the ref and Firestore in sync alongside React state.
  const setGeneratedPlan = (plan: MealPlan) => {
    setGeneratedPlanState(plan)
    generatedPlanRef.current = plan

    if (firebaseServices) {
      const uid = firebaseServices.auth.currentUser?.uid
      if (uid) {
        savePlan(firebaseServices.db, uid, plan).catch(console.error)
      }
    }
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
    signedIn, signIn, signOut, user,
    favorites, toggleFavorite,
    overrides, setOverride, getOverride,
    authOpen, setAuthOpen,
    planSaved, setPlanSaved,
    editTarget, setEditTarget,
    groceryTags, setGroceryTag,
    pantryHave, setHave,
    groceryEdits, setGroceryEdit,
    groceryAdditions, addGroceryItem, removeGroceryAddition,
    onboardingState, setOnboardingState,
    profile, setProfile,
    recipeTarget, setRecipeTarget,
    generatedPlan, setGeneratedPlan,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
