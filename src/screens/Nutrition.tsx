import type { AppRoute } from '../types/store'
import type { GlyphKind, ColorTone } from '../types/meal'
import { Icon, FoodGlyph } from '../components/Icons'
import { PageHeader } from '../components/PageHeader'
import { useStore } from '../context/StoreContext'
import { MEALS, DAYS, PLAN, TODAY_INDEX } from '../data/meals'

interface NutritionProps {
  go: (r: AppRoute) => void
}

export function Nutrition({ go }: NutritionProps) {
  const { profile } = useStore()
  const goalKcal    = profile?.goalKcal    ?? 1900
  const goalProtein = profile?.goalProtein ?? 110

  const dayTotals = PLAN.map((day) => {
    const keys = ['breakfast', 'lunch', 'snack', 'dinner'] as const
    return keys.reduce(
      (acc, k) => {
        const m = MEALS[day[k]]
        if (!m) return acc
        return { kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, fat: acc.fat + m.fat, sugar: acc.sugar + m.sugar, fiber: acc.fiber + m.fiber }
      },
      { kcal: 0, p: 0, c: 0, fat: 0, sugar: 0, fiber: 0 },
    )
  })

  const weekly = dayTotals.reduce(
    (a, d) => ({ kcal: a.kcal + d.kcal, p: a.p + d.p, c: a.c + d.c, fat: a.fat + d.fat, sugar: a.sugar + d.sugar, fiber: a.fiber + d.fiber }),
    { kcal: 0, p: 0, c: 0, fat: 0, sugar: 0, fiber: 0 },
  )

  const avg = {
    kcal:  Math.round(weekly.kcal  / 7),
    p:     Math.round(weekly.p     / 7),
    c:     Math.round(weekly.c     / 7),
    fat:   Math.round(weekly.fat   / 7),
    sugar: Math.round(weekly.sugar / 7),
    fiber: Math.round(weekly.fiber / 7),
  }

  const maxKcal = Math.max(...dayTotals.map((d) => d.kcal))

  return (
    <div className="page">
      <PageHeader
        eyebrow="Nutrition · May 19 – 25"
        title={<>How the week <em>adds up.</em></>}
        sub="Daily averages versus your targets, plus where the calories actually come from. Numbers are estimates — within ±5% of reality."
        actions={<>
          <button className="btn btn-ghost btn-sm">Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => go('dashboard')}>
            Back to plan <Icon.Arrow />
          </button>
        </>}
      />

      {/* Average-day summary */}
      <div className="summary-bar">
        <div className="summary-cell">
          <div className="lbl">Avg daily calories</div>
          <div className="val">{avg.kcal.toLocaleString()}</div>
          <div className="sub">target {goalKcal.toLocaleString()} · within ±5%</div>
        </div>
        <div className="summary-cell">
          <div className="lbl">Avg daily protein</div>
          <div className="val">{avg.p}g</div>
          <div className="sub" style={{ color: 'var(--olive)' }}>hits {goalProtein}g floor every day</div>
        </div>
        <div className="summary-cell">
          <div className="lbl">Avg added sugar</div>
          <div className="val">{avg.sugar}g</div>
          <div className="sub" style={{ color: 'var(--olive)' }}>under 25g cap</div>
        </div>
        <div className="summary-cell">
          <div className="lbl">Avg fibre</div>
          <div className="val">{avg.fiber}g</div>
          <div className="sub">solid — aim for 25g+</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="nutrition-layout">

        {/* Daily calorie bars */}
        <div className="card">
          <div className="between mb-4">
            <div>
              <h3 className="h-2">Daily calories</h3>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Stacked by macro · target line at 1,900 kcal</div>
            </div>
            <div className="legend">
              <div className="legend-item"><span className="legend-swatch" style={{ background: 'var(--paprika)' }} /> Protein</div>
              <div className="legend-item"><span className="legend-swatch" style={{ background: 'var(--saffron)' }} /> Carbs</div>
              <div className="legend-item"><span className="legend-swatch" style={{ background: 'var(--olive)' }} /> Fat</div>
            </div>
          </div>

          <div style={{ position: 'relative', paddingTop: 16 }}>
            <div style={{
              position: 'absolute',
              top: `${16 + 180 - (goalKcal / maxKcal * 180)}px`,
              left: 0, right: 0, height: 1,
              borderTop: '1px dashed var(--paprika)',
              opacity: 0.7, zIndex: 1,
            }}>
              <span style={{ position: 'absolute', right: 0, top: -16, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--paprika)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {goalKcal.toLocaleString()} target
              </span>
            </div>

            <div className="chart-bars">
              {DAYS.map((day, i) => {
                const d = dayTotals[i]
                const heightPx = maxKcal > 0 ? (d.kcal / maxKcal) * 180 : 0
                const pKcal = d.p   * 4
                const cKcal = d.c   * 4
                const fKcal = d.fat * 9
                const denom = pKcal + cKcal + fKcal || 1
                return (
                  <div className={`chart-bar${i === TODAY_INDEX ? ' today' : ''}`} key={day.name}>
                    <div className="stack" style={{ height: heightPx }}>
                      <span style={{ background: 'var(--olive)',   flex: `${fKcal / denom} 0 0` }} />
                      <span style={{ background: 'var(--saffron)', flex: `${cKcal / denom} 0 0` }} />
                      <span style={{ background: 'var(--paprika)', flex: `${pKcal / denom} 0 0` }} />
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink)' }}>{d.kcal.toLocaleString()}</div>
                    <div className="day-label">{day.short}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Macro breakdown */}
        <div className="card macro-card">
          <h3 className="h-2 mb-2">Average plate</h3>
          <div className="muted mb-4" style={{ fontSize: 13 }}>How a typical day's calories split between macros.</div>

          <div className="bar-row" style={{ marginBottom: 14 }}>
            <span className="lbl">Protein</span>
            <div className="macro-bar"><span className="fill" style={{ width: `${avg.kcal > 0 ? Math.round((avg.p * 4 / avg.kcal) * 100) : 0}%`, background: 'var(--paprika)' }} /></div>
            <span className="num">{avg.p}g · {avg.kcal > 0 ? Math.round((avg.p * 4 / avg.kcal) * 100) : 0}%</span>
          </div>
          <div className="bar-row" style={{ marginBottom: 14 }}>
            <span className="lbl">Carbs</span>
            <div className="macro-bar"><span className="fill" style={{ width: `${avg.kcal > 0 ? Math.round((avg.c * 4 / avg.kcal) * 100) : 0}%`, background: 'var(--saffron)' }} /></div>
            <span className="num">{avg.c}g · {avg.kcal > 0 ? Math.round((avg.c * 4 / avg.kcal) * 100) : 0}%</span>
          </div>
          <div className="bar-row" style={{ marginBottom: 14 }}>
            <span className="lbl">Fat</span>
            <div className="macro-bar"><span className="fill" style={{ width: `${avg.kcal > 0 ? Math.round((avg.fat * 9 / avg.kcal) * 100) : 0}%`, background: 'var(--olive)' }} /></div>
            <span className="num">{avg.fat}g · {avg.kcal > 0 ? Math.round((avg.fat * 9 / avg.kcal) * 100) : 0}%</span>
          </div>

          <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 16, marginTop: 8 }}>
            <div className="bar-row" style={{ marginBottom: 10 }}>
              <span className="lbl">Sugar</span>
              <div className="macro-bar"><span className="fill" style={{ width: `${Math.min(100, (avg.sugar / 25) * 100)}%`, background: 'var(--paprika)' }} /></div>
              <span className="num">{avg.sugar}g / 25g</span>
            </div>
            <div className="bar-row">
              <span className="lbl">Fibre</span>
              <div className="macro-bar"><span className="fill" style={{ width: `${Math.min(100, (avg.fiber / 30) * 100)}%`, background: 'var(--olive)' }} /></div>
              <span className="num">{avg.fiber}g / 30g</span>
            </div>
          </div>
        </div>

        {/* Protein sources */}
        <div className="card">
          <h3 className="h-2 mb-2">Where your protein comes from</h3>
          <div className="muted mb-4" style={{ fontSize: 13 }}>Top contributors across the week</div>
          {([
            { name: 'Paneer',                       g: 78, glyph: 'Cube',  tone: 'paprika'  },
            { name: 'Dals & legumes',               g: 64, glyph: 'Bowl',  tone: 'paprika'  },
            { name: 'Tofu & soya',                  g: 52, glyph: 'Cube',  tone: 'olive'    },
            { name: 'Curd & yoghurt',               g: 36, glyph: 'Glass', tone: 'saffron'  },
            { name: 'Grains (quinoa, brown rice)',   g: 28, glyph: 'Rice',  tone: 'saffron'  },
          ] as { name: string; g: number; glyph: GlyphKind; tone: ColorTone }[]).map((row) => (
            <div key={row.name} className="row gap-3" style={{ padding: '10px 0', borderBottom: '1px dashed var(--hairline)' }}>
              <FoodGlyph kind={row.glyph} tone={row.tone} size="sm" />
              <div style={{ flex: 1 }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span className="serif" style={{ fontWeight: 500, fontSize: 14 }}>{row.name}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{row.g}g</span>
                </div>
                <div className="macro-bar" style={{ height: 4 }}>
                  <span className="fill" style={{ width: `${(row.g / 78) * 100}%`, background: 'var(--paprika)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div className="card-flat">
          <div className="eyebrow mb-2">What we noticed</div>
          <h3 className="h-2 mb-4">Three small adjustments worth knowing</h3>

          <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--hairline-strong)' }}>
            <div className="row gap-2 mb-2">
              <span className="chip chip-olive"><Icon.Check size={10} /> On track</span>
            </div>
            <p style={{ margin: 0, fontSize: 14 }}>
              Protein is steady at <strong>~120g/day</strong> — comfortably above your 110g floor. Paneer and dals do most of the work.
            </p>
          </div>

          <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--hairline-strong)' }}>
            <div className="row gap-2 mb-2">
              <span className="chip chip-saffron"><Icon.Sparkle size={10} /> Heads up</span>
            </div>
            <p style={{ margin: 0, fontSize: 14 }}>
              <strong>Friday's smoothie</strong> pushes sugar to 22g — under cap, but the highest day. Swap to a savoury breakfast if you'd like more headroom.
            </p>
          </div>

          <div>
            <div className="row gap-2 mb-2">
              <span className="chip chip-saffron"><Icon.Sparkle size={10} /> Heads up</span>
            </div>
            <p style={{ margin: 0, fontSize: 14 }}>
              Thursday is your <strong>lowest-fibre day</strong> at 18g. Adding a side of sprout salad would close that gap without changing dinner.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
