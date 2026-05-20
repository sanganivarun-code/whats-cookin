import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { StoreState, Override, OverrideMap, AppUser, EditTarget } from '../types/store'
import type { GroceryTagMap, PantryMap, GroceryEditMap, GroceryAdditionsMap, GroceryEdit } from '../types/grocery'
import type { MealSlot, MealPlan } from '../types/meal'
import type { OnboardingState, UserProfile } from '../types/profile'

const StoreContext = createContext<StoreState | null>(null)

export function useStore(): StoreState {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false)
  const [user] = useState<AppUser>({
    name: 'Aanya Sharma',
    initial: 'A',
    email: 'aanya@cookin.test',
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
  const [generatedPlan, setGeneratedPlan] = useState<MealPlan | null>(null)

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

  const toggleFavorite = (mealId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(mealId)) next.delete(mealId)
      else next.add(mealId)
      return next
    })
  }

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

  const signIn = () => {
    setSignedIn(true)
    setAuthOpen(false)
    setPlanSaved(true)
  }
  const signOut = () => {
    setSignedIn(false)
    setPlanSaved(false)
  }

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
