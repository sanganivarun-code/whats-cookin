import { useState } from 'react'

function formatIngredientName(name: string): string {
  const parts = name.split(',').map((p) => p.trim())
  const tc = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())
  if (parts.length === 1) return tc(parts[0])
  if (parts.length === 2) return `${tc(parts[0])} - ${tc(parts[1])}`
  // "Tomatoes, Cherry, Halved" → "Cherry Tomatoes - Halved"
  const [base, modifier, ...prepParts] = parts
  const prep = prepParts.join(' ')
  return prep
    ? `${tc(modifier)} ${tc(base)} - ${tc(prep)}`
    : `${tc(modifier)} ${tc(base)}`
}
import type { AppRoute } from '../types/store'
import { useStore } from '../context/StoreContext'
import { Icon } from '../components/Icons'
import { scaleAmt } from '../utils/mealPlan'

interface RecipeProps {
  go: (r: AppRoute) => void
}

export function Recipe({ go }: RecipeProps) {
  const { favorites, toggleFavorite, groceryEdits, recipeTarget, runtimeRecipes, getMeal } = useStore()
  const r = recipeTarget ? runtimeRecipes[recipeTarget] : undefined
  const [servings, setServings] = useState(r?.servings ?? 2)

  const subs = Object.entries(groceryEdits)
    .filter(([orig, e]) => e?.name && e.name !== orig)
    .map(([orig, e]) => ({ original: orig, replacement: e.name as string }))

  const mealName = recipeTarget ? getMeal(recipeTarget)?.name : undefined

  if (!r) {
    return (
      <div className="page">
        <button className="nav-link mb-4" onClick={() => go('dashboard')} style={{ paddingLeft: 0 }}>
          <Icon.ArrowLeft size={14} /> Back to this week
        </button>
        <div className="page-header mb-6">
          <div style={{ maxWidth: 700 }}>
            {mealName && <h1 className="h-1">{mealName}</h1>}
            <p className="lead mt-2">Full recipe details are only available for AI-generated plans.</p>
          </div>
          <div className="row gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => go('onboarding')}>Generate AI plan</button>
          </div>
        </div>
      </div>
    )
  }

  const favId = recipeTarget ?? r.id
  const isFav = favorites.has(favId)
  const ratio = servings / r.servings

  const ingredientSub: Record<number, { original: string; replacement: string }> = {}
  subs.forEach((s) => {
    const keywords = s.original.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3)
    r.ingredients.forEach((ing, idx) => {
      const lower = ing.name.toLowerCase()
      if (keywords.some((w) => lower.includes(w))) ingredientSub[idx] = s
    })
  })

  const CATEGORY_ORDER = ['Produce', 'Dairy & Protein', 'Grains & Bread', 'Spices & Oils', 'Pantry', 'Other'] as const

  const grouped = r.ingredients.reduce<Record<string, { idx: number; ing: typeof r.ingredients[number] }[]>>(
    (acc, ing, idx) => {
      const cat = ing.category ?? 'Other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push({ idx, ing })
      return acc
    },
    {}
  )

  const n = r.nutrition
  const denom = n.p * 4 + n.c * 4 + n.fat * 9
  const pPct  = denom > 0 ? Math.round((n.p   * 4 / denom) * 100) : 0
  const cPct  = denom > 0 ? Math.round((n.c   * 4 / denom) * 100) : 0
  const fatPct = denom > 0 ? Math.round((n.fat * 9 / denom) * 100) : 0

  return (
    <div className="page">
      <button className="nav-link mb-4" onClick={() => go('dashboard')} style={{ paddingLeft: 0 }}>
        <Icon.ArrowLeft size={14} /> Back to this week
      </button>

      <div className="page-header mb-6">
        <div style={{ maxWidth: 700 }}>
          {recipeTarget && getMeal(recipeTarget) && getMeal(recipeTarget)!.id !== r.id && (
            <div className="eyebrow mb-2">{getMeal(recipeTarget)!.name}</div>
          )}
          <h1 className="h-1">{r.name}</h1>
          <p className="lead mt-2">{r.subtitle}</p>
          <div className="row gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
            {r.tags.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost btn-sm"><Icon.Swap /> Swap meal</button>
          <button
            className={`btn btn-sm${isFav ? ' btn-accent' : ' btn-ghost'}`}
            onClick={() => toggleFavorite(favId)}>
            <Icon.Heart size={14} filled={isFav} /> {isFav ? 'Favorited' : 'Favorite'}
          </button>
          <button className="btn btn-primary btn-sm"><Icon.Cart /> Add to grocery</button>
        </div>
      </div>

      <div className="recipe-grid">
        {/* LEFT */}
        <div>
          <div className="row gap-6 mb-6">
            <div>
              <div className="eyebrow mb-2">Cook time</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{r.time} min</div>
            </div>
            <div>
              <div className="eyebrow mb-2">Difficulty</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{r.difficulty}</div>
            </div>
            <div>
              <div className="eyebrow mb-2">Servings</div>
              <div className="stepper">
                <button onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
                <span className="val">{servings}</span>
                <button onClick={() => setServings(servings + 1)}>+</button>
              </div>
            </div>
            <div>
              <div className="eyebrow mb-2">Per serving</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>
                {r.nutrition.kcal} <span className="mono muted" style={{ fontSize: 13 }}>kcal</span>
              </div>
            </div>
          </div>

          <h2 className="h-2 mb-4">Method</h2>
          <div>
            {r.steps.map((step, i) => (
              <div className="step" key={i}>
                <div className="step-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="step-text">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <aside>
          <div className="card mb-4">
            <div className="eyebrow mb-2">Nutrition · per serving</div>
            <div className="nutrition-grid mt-4">
              <div className="nut-cell">
                <div className="lbl">Calories</div>
                <div className="val">{n.kcal}<span className="unit">kcal</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Protein</div>
                <div className="val">{n.p}<span className="unit">g</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Carbs</div>
                <div className="val">{n.c}<span className="unit">g</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Fat</div>
                <div className="val">{n.fat}<span className="unit">g</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Sugar</div>
                <div className="val">{n.sugar}<span className="unit">g</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Fibre</div>
                <div className="val">{n.fiber}<span className="unit">g</span></div>
              </div>
            </div>

            <div className="mt-6">
              <div className="bar-row" style={{ marginBottom: 8 }}>
                <span className="lbl">Protein</span>
                <div className="macro-bar"><span className="fill" style={{ width: `${pPct}%`, background: 'var(--paprika)' }} /></div>
                <span className="num">{pPct}%</span>
              </div>
              <div className="bar-row" style={{ marginBottom: 8 }}>
                <span className="lbl">Carbs</span>
                <div className="macro-bar"><span className="fill" style={{ width: `${cPct}%`, background: 'var(--saffron)' }} /></div>
                <span className="num">{cPct}%</span>
              </div>
              <div className="bar-row">
                <span className="lbl">Fat</span>
                <div className="macro-bar"><span className="fill" style={{ width: `${fatPct}%`, background: 'var(--olive)' }} /></div>
                <span className="num">{fatPct}%</span>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="between mb-4">
              <h3 className="h-3">Ingredients</h3>
              <span className="mono muted" style={{ fontSize: 11 }}>for {servings} servings</span>
            </div>
            {subs.length > 0 && (
              <div className="subs-callout">
                <div className="lbl">Your kitchen tweaks</div>
                <ul>
                  {subs.map((s) => (
                    <li key={s.original}>
                      <strong>{s.replacement}</strong>
                      <span className="was">{s.original}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
                <div key={cat}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', padding: '10px 0 4px' }}>
                    {cat}
                  </div>
                  {grouped[cat].map(({ idx, ing }) => {
                    const sub = ingredientSub[idx]
                    return (
                      <div className="ingredient-row" key={idx}>
                        <span>
                          {formatIngredientName(ing.name)}
                          {sub && <span className="renamed-note">({formatIngredientName(sub.replacement)})</span>}
                        </span>
                        <span className="amt">{scaleAmt(ing.amt, ratio)}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
