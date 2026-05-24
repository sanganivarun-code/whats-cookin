import { useState } from 'react'
import type { Override, AppRoute } from '../types/store'
import { useStore } from '../context/StoreContext'
import { Icon, FoodGlyph } from './Icons'
import { DAYS, PLAN } from '../data/meals'
import { groupByCuisine, sortCuisineGroups } from '../utils/favorites'

interface MealEditSheetProps {
  go: (r: AppRoute) => void
}

export function MealEditSheet({ go }: MealEditSheetProps) {
  const {
    editTarget, setEditTarget, setOverride, getOverride,
    favoriteRecords, generatedPlan, getMeal,
  } = useStore()
  const [customName, setCustomName] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [showFavPicker, setShowFavPicker] = useState(false)

  if (!editTarget) return null

  const { dayIndex, slot } = editTarget
  const day = DAYS[dayIndex]
  const activePlan = generatedPlan ?? PLAN
  const planDay = activePlan[dayIndex]
  const override = getOverride(dayIndex, slot)
  const plannedMeal = (!override || override.kind === 'default') ? (getMeal(planDay[slot]) ?? null) : null
  const originalMeal = getMeal(planDay[slot]) ?? null
  const hasActiveOverride = override !== null && override.kind !== 'default'
  const slotLabel = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }[slot]

  // Favorites that have a usable meal snapshot — the only ones we can swap in.
  const pickableFavorites = [...favoriteRecords.values()].filter(r => r.snapshot != null)

  const close = () => {
    setEditTarget(null)
    setShowCustom(false)
    setShowFavPicker(false)
    setCustomName('')
  }
  const apply = (val: Override | null) => { setOverride(dayIndex, slot, val); close() }

  // ─── Favorite picker panel ─────────────────────────────────────────────────

  if (showFavPicker) {
    const grouped = sortCuisineGroups(groupByCuisine(pickableFavorites.map(r => r.snapshot!)))
    return (
      <div className="overlay" onClick={close}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={close}><Icon.X /></button>
          <button className="btn btn-ghost mb-4" style={{ paddingLeft: 0 }} onClick={() => setShowFavPicker(false)}>
            <Icon.ArrowLeft size={14} /> Back
          </button>
          <div className="eyebrow mb-2">{day.name} · {slotLabel}</div>
          <h3 className="h-2 mb-4">Pick a favorite</h3>
          <div className="col gap-6">
            {grouped.map(([cuisine, meals]) => (
              <div key={cuisine}>
                <div className="eyebrow mb-2">{cuisine}</div>
                <div className="action-list">
                  {meals.map((meal) => (
                    <button
                      key={meal.id}
                      className="action-row"
                      onClick={() => apply({ kind: 'custom', mealId: meal.id, name: meal.name })}>
                      <FoodGlyph kind={meal.glyph} tone={meal.tone} size="sm" />
                      <div className="action-text">
                        <div className="action-title">{meal.name}</div>
                        <div className="action-sub">{meal.kcal} kcal · {meal.p}g protein</div>
                      </div>
                      <Icon.Arrow size={14} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Main sheet ────────────────────────────────────────────────────────────

  return (
    <div className="overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close}><Icon.X /></button>
        <div className="eyebrow mb-2">{day.name} · {slotLabel}</div>
        <h3 className="h-2 mb-2">
          {plannedMeal ? plannedMeal.name : override?.name ?? 'Open slot'}
        </h3>
        <p className="muted" style={{ fontSize: 13 }}>
          What would you like to do with this meal?
        </p>

        {!showCustom ? (
          <div className="action-list mt-4">
            {hasActiveOverride && originalMeal && (
              <button className="action-row" onClick={() => apply(null)}>
                <div className="action-icon"><Icon.ArrowLeft size={16} /></div>
                <div className="action-text">
                  <div className="action-title">Restore planned meal</div>
                  <div className="action-sub">Original plan: {originalMeal.name}</div>
                </div>
                <Icon.Arrow size={14} />
              </button>
            )}
            {plannedMeal && (
              <button className="action-row" onClick={() => { close(); go('recipe') }}>
                <FoodGlyph kind={plannedMeal.glyph} tone={plannedMeal.tone} size="sm" />
                <div className="action-text">
                  <div className="action-title">View recipe</div>
                  <div className="action-sub">Ingredients, method, nutrition</div>
                </div>
                <Icon.Arrow size={14} />
              </button>
            )}
            {pickableFavorites.length > 0 && (
              <button className="action-row" onClick={() => setShowFavPicker(true)}>
                <div className="action-icon"><Icon.Heart size={16} /></div>
                <div className="action-text">
                  <div className="action-title">Swap with favorite</div>
                  <div className="action-sub">
                    {pickableFavorites.length} saved meal{pickableFavorites.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <Icon.Arrow size={14} />
              </button>
            )}
            {plannedMeal && (
              <button className="action-row" onClick={() => apply({ kind: 'default' })}>
                <div className="action-icon"><Icon.Swap size={16} /></div>
                <div className="action-text">
                  <div className="action-title">Swap to something else</div>
                  <div className="action-sub">We'll suggest three alternatives that fit the day's macros</div>
                </div>
                <Icon.Arrow size={14} />
              </button>
            )}
            <button className="action-row" onClick={() => apply({ kind: 'eating-out' })}>
              <div className="action-icon"><Icon.Out size={16} /></div>
              <div className="action-text">
                <div className="action-title">Eating out</div>
                <div className="action-sub">Skip this slot — we won't add it to your grocery list</div>
              </div>
              <Icon.Arrow size={14} />
            </button>
            <button className="action-row" onClick={() => setShowCustom(true)}>
              <div className="action-icon"><Icon.Chef size={16} /></div>
              <div className="action-text">
                <div className="action-title">I'll cook my own</div>
                <div className="action-sub">Add a dish name — we'll leave the recipe to you</div>
              </div>
              <Icon.Arrow size={14} />
            </button>
            <button className="action-row danger" onClick={() => apply({ kind: 'removed' })}>
              <div className="action-icon"><Icon.Trash size={16} /></div>
              <div className="action-text">
                <div className="action-title">Remove from plan</div>
                <div className="action-sub">Leave this slot empty</div>
              </div>
              <Icon.Arrow size={14} />
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <label className="field-label">What are you cooking?</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Spaghetti aglio e olio"
              value={customName}
              autoFocus
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && customName.trim() && apply({ kind: 'self-cook', name: customName.trim() })}
            />
            <div className="field-hint">We'll keep this slot in your plan but skip ingredients in the grocery list.</div>
            <div className="row gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setShowCustom(false)}>
                <Icon.ArrowLeft size={14} /> Back
              </button>
              <button
                className="btn btn-accent"
                disabled={!customName.trim()}
                style={!customName.trim() ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                onClick={() => customName.trim() && apply({ kind: 'self-cook', name: customName.trim() })}>
                Add to plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
