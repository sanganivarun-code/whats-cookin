import { useState } from 'react'
import type { AppRoute } from '../types/store'
import type { Meal, MealSlot } from '../types/meal'
import { useStore } from '../context/StoreContext'
import { Icon, FoodGlyph } from '../components/Icons'
import { DAYS, PLAN, TODAY_INDEX } from '../data/meals'
import { MEAL_SLOT_LIST } from '../utils/mealPlan'

interface TodayProps {
  go: (r: AppRoute) => void
}

interface TodayEntry {
  key: MealSlot
  label: string
  meal: Meal | null
  leftover?: boolean
  eatingOut?: boolean
  selfCook?: boolean
  name?: string
}

export function Today({ go }: TodayProps) {
  const { favorites, toggleFavorite, getOverride, setEditTarget, setRecipeTarget, profile, user, generatedPlan, getMeal } = useStore()
  const [cooked, setCooked] = useState<Record<string, boolean>>({})

  const dayIndex = TODAY_INDEX
  const day = DAYS[dayIndex]
  const activePlan = generatedPlan ?? PLAN
  const planDay = activePlan[dayIndex]

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const meals: TodayEntry[] = MEAL_SLOT_LIST.flatMap((slot): TodayEntry[] => {
    if (slot.key === 'lunch' && planDay.leftover) {
      const m = getMeal(planDay.leftover) ?? null
      return [{ key: slot.key, label: slot.label, meal: m, leftover: true }]
    }
    const override = getOverride(dayIndex, slot.key)
    if (override && override.kind === 'removed') return []
    if (override && override.kind === 'eating-out') {
      return [{ key: slot.key, label: slot.label, meal: null, eatingOut: true }]
    }
    if (override && (override.kind === 'self-cook' || override.kind === 'custom')) {
      const m = override.kind === 'custom' && override.mealId ? (getMeal(override.mealId) ?? null) : null
      return [{ key: slot.key, label: slot.label, meal: m, selfCook: true, name: override.name }]
    }
    return [{ key: slot.key, label: slot.label, meal: getMeal(planDay[slot.key]) ?? null }]
  })

  const dayKcal = meals.reduce((s, m) => s + (m.meal?.kcal ?? 0), 0)
  const dayP    = meals.reduce((s, m) => s + (m.meal?.p    ?? 0), 0)
  const totalCookTime = meals.reduce((s, m) => s + (m.leftover || m.eatingOut ? 0 : m.meal?.time ?? 0), 0)
  const cookedCount = Object.values(cooked).filter(Boolean).length

  return (
    <div className="page page-narrow today-page">
      <div className="today-header">
        <div className="eyebrow mb-2">{greeting}, {user.name.split(' ')[0]} · {day.name}, {day.date}</div>
        <h1 className="h-display" style={{ fontSize: 56 }}>
          What's <em>cookin'</em> today?
        </h1>
        <p className="lead mt-4">
          Four meals to make{meals.length === 4 ? '' : ' (or skip) '}across the day —
          {totalCookTime > 0
            ? <> roughly <strong style={{ color: 'var(--ink)' }}>{totalCookTime} minutes</strong> of active cooking.</>
            : ' nothing on the stove today.'}
        </p>
      </div>

      <div className="today-progress">
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <span className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{cookedCount}/{meals.length}</span>
          <span className="muted" style={{ fontSize: 13 }}>
            {cookedCount === 0
              ? 'Nothing cooked yet — let\'s begin.'
              : cookedCount === meals.length
                ? 'Done for the day. Well fed.'
                : 'On your way.'}
          </span>
        </div>
        <div className="today-progress-bar">
          <span className="fill" style={{ width: `${(cookedCount / meals.length) * 100}%` }} />
        </div>
      </div>

      <div className="today-meals">
        {meals.map((m) => {
          const id = m.key
          const isCooked = !!cooked[id]

          if (m.eatingOut) {
            return (
              <div key={id} className="today-meal eating-out">
                <div className="today-meal-eyebrow">{m.label}</div>
                <div className="row gap-4" style={{ alignItems: 'center' }}>
                  <div className="glyph" style={{ background: 'transparent', border: '1px dashed var(--saffron)', color: 'var(--saffron)' }}>
                    <Icon.Out size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-soft)' }}>Eating out</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>No cooking — enjoy.</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditTarget({ dayIndex, slot: m.key })}>
                    Change
                  </button>
                </div>
              </div>
            )
          }

          if (m.selfCook) {
            return (
              <div key={id} className={`today-meal self-cook${isCooked ? ' cooked' : ''}`}>
                <div className="today-meal-eyebrow"><Icon.Chef size={11} /> {m.label} · your recipe</div>
                <div className="row gap-4" style={{ alignItems: 'center' }}>
                  <FoodGlyph kind={m.meal?.glyph ?? 'Pot'} tone="olive" />
                  <div style={{ flex: 1 }}>
                    <div className="serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2 }}>{m.name}</div>
                    <div className="muted mt-2" style={{ fontSize: 13 }}>Cooking this one yourself — no recipe to show.</div>
                  </div>
                  <button className={`cook-toggle${isCooked ? ' on' : ''}`} onClick={() => setCooked((p) => ({ ...p, [id]: !p[id] }))}>
                    {isCooked ? <><Icon.Check size={14} /> Cooked</> : 'Mark cooked'}
                  </button>
                </div>
              </div>
            )
          }

          const meal = m.meal
          if (!meal) return null
          const isFav = favorites.has(meal.id)

          return (
            <div key={id} className={`today-meal${isCooked ? ' cooked' : ''}${m.leftover ? ' leftover' : ''}`}>
              <div className="today-meal-head">
                <div className="today-meal-eyebrow">
                  {m.leftover ? <><Icon.Leaf size={11} /> {m.label} · leftover from yesterday</> : m.label}
                </div>
                <button className={`heart-static${isFav ? ' on' : ''}`} onClick={() => toggleFavorite(meal.id)}>
                  <Icon.Heart filled={isFav} size={16} />
                </button>
              </div>

              <div className="row gap-4 mt-2" style={{ alignItems: 'center' }}>
                <FoodGlyph kind={meal.glyph} tone={meal.tone} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 className="h-2" style={{ fontSize: 26, lineHeight: 1.15 }}>{meal.name}</h2>
                  <div className="row gap-3 mt-2" style={{ flexWrap: 'wrap' }}>
                    <span className="today-stat"><Icon.Flame size={13} /> {meal.kcal} kcal</span>
                    <span className="today-stat"><span className="dot" style={{ background: 'var(--paprika)' }} /> {meal.p}g protein</span>
                    <span className="today-stat"><Icon.Clock size={13} /> {m.leftover ? 'Reheat' : `${meal.time} min`}</span>
                  </div>
                </div>
              </div>

              <div className="today-meal-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => { setRecipeTarget(meal.id); go('recipe') }}>
                  <Icon.Arrow size={12} /> View recipe
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditTarget({ dayIndex, slot: m.key })}>
                  <Icon.Swap /> Swap / Edit
                </button>
                <div style={{ flex: 1 }} />
                <button className={`cook-toggle${isCooked ? ' on' : ''}`}
                  onClick={() => setCooked((p) => ({ ...p, [id]: !p[id] }))}>
                  {isCooked ? <><Icon.Check size={14} /> Cooked</> : 'Mark cooked'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="today-footer">
        <div>
          <div className="eyebrow">Today's totals</div>
          <div className="serif mt-2" style={{ fontSize: 28, fontWeight: 500 }}>
            {dayKcal.toLocaleString()} <span className="mono muted" style={{ fontSize: 14 }}>kcal</span>
            <span style={{ color: 'var(--hairline-strong)', margin: '0 12px' }}>·</span>
            {dayP}g <span className="mono muted" style={{ fontSize: 14 }}>protein</span>
          </div>
          <div className="muted mt-2" style={{ fontSize: 13 }}>
            Target: {(profile?.goalKcal ?? 1900).toLocaleString()} kcal · {profile?.goalProtein ?? 110}g protein
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => go('dashboard')}>See the full week</button>
          <button className="btn btn-primary btn-sm" onClick={() => go('grocery')}>
            <Icon.Cart /> Grocery list
          </button>
        </div>
      </div>
    </div>
  )
}
