import type { AppRoute } from '../types/store'
import { useStore } from '../context/StoreContext'
import { Icon } from '../components/Icons'
import { PageHeader } from '../components/PageHeader'
import { DAYS, PLAN, TODAY_INDEX } from '../data/meals'
import { MEAL_SLOT_LIST } from '../utils/mealPlan'

interface DashboardProps {
  go: (r: AppRoute) => void
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({ go }: { go: (r: AppRoute) => void }) {
  const { favorites, toggleFavorite, getOverride, setEditTarget, setRecipeTarget, generatedPlan, getMeal } = useStore()
  const activePlan = generatedPlan ?? PLAN

  return (
    <div className="week-grid">
      {DAYS.map((day, i) => {
        const isToday = i === TODAY_INDEX
        const planDay = activePlan[i]
        let dayKcal = 0
        let dayP = 0

        return (
          <div key={day.name} className={`day-col${isToday ? ' today' : ''}`}>
            <div className="day-head">
              <div>
                <div className="day-name">{day.short}</div>
                <div className="day-date">{day.date}</div>
              </div>
              {isToday && <span className="mono" style={{ fontSize: 9, color: 'var(--paprika)', letterSpacing: '0.1em' }}>TODAY</span>}
            </div>

            {planDay.leftover && (
              <button className="meal-card leftover" onClick={() => { setRecipeTarget(planDay.leftover!); go('recipe') }}>
                <span className="meal-eyebrow"><Icon.Leaf size={10} /> Leftover lunch</span>
                <span className="meal-name">{getMeal(planDay.leftover)?.name}</span>
                <span className="meal-kcal">{getMeal(planDay.leftover)?.kcal} kcal</span>
              </button>
            )}

            {MEAL_SLOT_LIST.map((slot) => {
              if (slot.key === 'lunch' && planDay.leftover) return null
              const override = getOverride(i, slot.key)
              const meal = getMeal(planDay[slot.key])

              if (override && override.kind === 'removed') {
                return (
                  <button key={slot.key} className="meal-card removed"
                    onClick={() => setEditTarget({ dayIndex: i, slot: slot.key })}>
                    <span className="meal-eyebrow">{slot.label}</span>
                    <span className="row gap-2" style={{ fontSize: 12 }}>
                      <Icon.Plus size={12} /> Add a meal
                    </span>
                  </button>
                )
              }

              if (override && override.kind === 'eating-out') {
                return (
                  <div key={slot.key} className="meal-card eating-out" style={{ position: 'relative' }}>
                    <button className="meal-menu-btn" style={{ position: 'absolute', top: 6, right: 6 }}
                      onClick={(e) => { e.stopPropagation(); setEditTarget({ dayIndex: i, slot: slot.key }) }}>
                      <Icon.Dots />
                    </button>
                    <span className="meal-eyebrow">{slot.label}</span>
                    <span className="meal-name" style={{ fontStyle: 'italic' }}>Eating out</span>
                    <span className="meal-kcal muted">— skipped —</span>
                  </div>
                )
              }

              if (override && (override.kind === 'self-cook' || override.kind === 'custom')) {
                const m = override.kind === 'custom' && override.mealId ? getMeal(override.mealId) ?? null : null
                if (m) { dayKcal += m.kcal; dayP += m.p }
                return (
                  <div key={slot.key} className="meal-card self-cook" style={{ position: 'relative' }}>
                    <button className="meal-menu-btn" style={{ position: 'absolute', top: 6, right: 6 }}
                      onClick={(e) => { e.stopPropagation(); setEditTarget({ dayIndex: i, slot: slot.key }) }}>
                      <Icon.Dots />
                    </button>
                    <span className="meal-eyebrow"><Icon.Chef size={10} /> {slot.label}</span>
                    <span className="meal-name">{override.name}</span>
                    <span className="meal-kcal muted">{m ? `${m.kcal} kcal · ${m.p}g P` : 'your recipe'}</span>
                  </div>
                )
              }

              if (!meal) return null
              dayKcal += meal.kcal
              dayP += meal.p
              const isFav = favorites.has(meal.id)

              return (
                <div key={slot.key} className="meal-card" style={{ position: 'relative' }}>
                  <div className="meal-actions">
                    <button className={`heart-btn${isFav ? ' on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(meal.id) }}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
                      <Icon.Heart filled={isFav} size={12} />
                    </button>
                    <button className="meal-menu-btn"
                      onClick={(e) => { e.stopPropagation(); setEditTarget({ dayIndex: i, slot: slot.key }) }}
                      title="Edit meal">
                      <Icon.Dots />
                    </button>
                  </div>
                  <button onClick={() => { setRecipeTarget(meal.id); go('recipe') }} style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, color: 'inherit', fontFamily: 'inherit', cursor: 'pointer', width: '100%' }}>
                    <span className="meal-eyebrow">{slot.label}</span>
                    <span className="meal-name">{meal.name}</span>
                    <span className="meal-kcal">{meal.kcal} kcal · {meal.p}g P</span>
                  </button>
                </div>
              )
            })}

            <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
              <span>{dayKcal.toLocaleString()} kcal</span>
              <span>{dayP}g P</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard({ go }: DashboardProps) {
  const { signedIn, setAuthOpen, planSaved, favorites, profile, generatedPlan, getMeal, savePlanToCloud, planSource } = useStore()
  const activePlan = generatedPlan ?? PLAN

  const avgKcal = Math.round(
    activePlan.reduce((s, day) =>
      s + MEAL_SLOT_LIST.reduce((acc, slot) => acc + (getMeal(day[slot.key])?.kcal ?? 0), 0), 0) / 7
  )
  const avgP = Math.round(
    activePlan.reduce((s, day) =>
      s + MEAL_SLOT_LIST.reduce((acc, slot) => acc + (getMeal(day[slot.key])?.p ?? 0), 0), 0) / 7
  )

  return (
    <div className="page">
      {planSource === 'sample' && !signedIn ? (
        <div className="save-banner">
          <div className="left">
            <Icon.Sparkle />
            <span>This is a <strong>sample plan.</strong> Sign in to generate your personalised AI plan.</span>
          </div>
          <button className="btn btn-accent btn-sm" onClick={() => setAuthOpen(true)}>Sign in</button>
        </div>
      ) : planSource === 'sample' && signedIn ? (
        <div className="save-banner">
          <div className="left">
            <Icon.Sparkle />
            <span>This is a <strong>sample plan.</strong> Go back to onboarding to generate your AI plan.</span>
          </div>
          <button className="btn btn-accent btn-sm" onClick={() => go('onboarding')}>Generate AI plan</button>
        </div>
      ) : !signedIn ? (
        <div className="save-banner">
          <div className="left">
            <Icon.Lock />
            <span>This plan is in your browser only. <em>Sign in</em> to save it, sync across devices, and keep your favorites.</span>
          </div>
          <div className="row gap-2">
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bg)', borderColor: 'rgba(250,246,239,0.3)' }} onClick={() => setAuthOpen(true)}>
              Create account
            </button>
            <button className="btn btn-accent btn-sm" onClick={() => setAuthOpen(true)}>Sign in</button>
          </div>
        </div>
      ) : planSaved ? (
        <div className="row gap-2 mb-4">
          <span className="save-status"><span className="dot" /> Saved · synced 2 minutes ago</span>
          <span className="muted" style={{ fontSize: 12 }}>· May 19 plan</span>
        </div>
      ) : generatedPlan ? (
        <div className="save-banner">
          <div className="left">
            <Icon.Sparkle />
            <span>Your plan is ready. <em>Save it</em> to sync across devices and keep it for next time.</span>
          </div>
          <button className="btn btn-accent btn-sm" onClick={savePlanToCloud}>Save plan</button>
        </div>
      ) : null}

      {/* Plan source badge */}
      {planSource === 'gemini' && (
        <div className="row gap-2 mb-3">
          <span className="chip chip-saffron" style={{ fontSize: 11 }}><Icon.Sparkle size={10} /> AI Plan</span>
        </div>
      )}
      {planSource === 'sample' && (
        <div className="row gap-2 mb-3">
          <span className="chip" style={{ fontSize: 11 }}>Sample Plan</span>
        </div>
      )}

      <PageHeader
        eyebrow="This week · May 19 – 25"
        title={<>A week for <em>{profile?.household ?? 'your household'}</em></>}
        sub={profile
          ? `${profile.diet}${profile.emphasis.length ? ' · ' + profile.emphasis.join(' · ') : ''}. ${profile.servings} serving${profile.servings !== 1 ? 's' : ''} of every meal — dinners flow into next-day lunches where it makes sense.`
          : 'Your weekly meal plan. Dinners flow into next-day lunches where it makes sense.'}
        actions={<>
          <button className="btn btn-ghost btn-sm"><Icon.Sparkle /> Regenerate</button>
          <button className="btn btn-primary btn-sm" onClick={() => go('grocery')}>
            <Icon.Cart /> Grocery list
          </button>
        </>}
      />

      <div className="between mb-4">
        <span className="muted" style={{ fontSize: 13 }}>Day-by-day with all four meals · click any to edit</span>
        <div className="row gap-2">
          <span className="chip"><span className="dot" style={{ background: 'var(--paprika)' }} /> Today</span>
          <span className="chip"><span className="dot" style={{ background: 'var(--olive)' }} /> Leftover</span>
          <span className="chip"><Icon.Heart size={10} /> {favorites.size} favorited</span>
        </div>
      </div>

      <div className="muted mb-4" style={{ fontSize: 13 }}>
        Avg {avgKcal.toLocaleString()} kcal · {avgP}g protein per day
      </div>

      <CalendarView go={go} />
    </div>
  )
}
