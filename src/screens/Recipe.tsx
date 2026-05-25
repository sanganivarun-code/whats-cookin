import { useState } from 'react'
import type { AppRoute } from '../types/store'
import type { StructuredIngredient } from '../types/meal'
import { useStore } from '../context/StoreContext'
import { Icon } from '../components/Icons'
import { scaleStructuredAmt } from '../utils/mealEntity'

interface RecipeProps {
  go: (r: AppRoute) => void
}

export function Recipe({ go }: RecipeProps) {
  const { favorites, toggleFavorite, groceryEdits, recipeTarget, getMealEntity } = useStore()
  const entity = recipeTarget ? getMealEntity(recipeTarget) : undefined
  const [servings, setServings] = useState(entity?.servings ?? 2)

  const subs = Object.entries(groceryEdits)
    .filter(([orig, e]) => e?.name && e.name !== orig)
    .map(([orig, e]) => ({ original: orig, replacement: e.name as string }))

  // Show the unavailable state when: no entity found, or entity has no recipe
  // detail (sample-plan meals, legacy favorites without a stored recipeSnapshot).
  if (!entity || (entity.ingredients.length === 0 && entity.steps.length === 0)) {
    return (
      <div className="page">
        <button className="nav-link mb-4" onClick={() => go('dashboard')} style={{ paddingLeft: 0 }}>
          <Icon.ArrowLeft size={14} /> Back to this week
        </button>
        <div className="page-header mb-6">
          <div style={{ maxWidth: 700 }}>
            {entity?.name && <h1 className="h-1">{entity.name}</h1>}
            <p className="lead mt-2">Recipe details aren't available for this meal. This can happen with older favorites saved before recipes were stored, or with sample-plan meals.</p>
          </div>
          <div className="row gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => go('onboarding')}>Generate AI plan</button>
          </div>
        </div>
      </div>
    )
  }

  const favId = recipeTarget ?? entity.id
  const isFav = favorites.has(favId)
  const ratio = servings / entity.servings

  const ingredientSub: Record<number, { original: string; replacement: string }> = {}
  subs.forEach((s) => {
    const keywords = s.original.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3)
    entity.ingredients.forEach((ing, idx) => {
      const lower = ing.name.toLowerCase()
      if (keywords.some((w) => lower.includes(w))) ingredientSub[idx] = s
    })
  })

  const CATEGORY_ORDER = ['Produce', 'Dairy & Protein', 'Grains & Bread', 'Spices & Oils', 'Pantry', 'Other'] as const

  const grouped = entity.ingredients.reduce<Record<string, { idx: number; ing: StructuredIngredient }[]>>(
    (acc, ing, idx) => {
      const cat = ing.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push({ idx, ing })
      return acc
    },
    {},
  )

  const n = entity.nutrition
  const denom = n.p * 4 + n.c * 4 + n.fat * 9
  const pPct   = denom > 0 ? Math.round((n.p   * 4 / denom) * 100) : 0
  const cPct   = denom > 0 ? Math.round((n.c   * 4 / denom) * 100) : 0
  const fatPct = denom > 0 ? Math.round((n.fat * 9 / denom) * 100) : 0

  return (
    <div className="page">
      <button className="nav-link mb-4" onClick={() => go('dashboard')} style={{ paddingLeft: 0 }}>
        <Icon.ArrowLeft size={14} /> Back to this week
      </button>

      <div className="page-header mb-6">
        <div style={{ maxWidth: 700 }}>
          <h1 className="h-1">{entity.name}</h1>
          <p className="lead mt-2">{entity.subtitle}</p>
          <div className="row gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
            {entity.tags.map((t) => <span key={t} className="chip">{t}</span>)}
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
              <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{entity.time} min</div>
            </div>
            <div>
              <div className="eyebrow mb-2">Difficulty</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{entity.difficulty}</div>
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
                {entity.nutrition.kcal} <span className="mono muted" style={{ fontSize: 13 }}>kcal</span>
              </div>
            </div>
          </div>

          <h2 className="h-2 mb-4">Method</h2>
          <div>
            {entity.steps.map((step, i) => (
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
                          {ing.name}{ing.prep ? ` — ${ing.prep}` : ''}
                          {sub && <span className="renamed-note">({sub.replacement})</span>}
                        </span>
                        <span className="amt">{scaleStructuredAmt(ing, ratio)}</span>
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
