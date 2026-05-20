import { useState } from 'react'
import type { AppRoute } from '../types/store'
import type { GlyphKind, ColorTone } from '../types/meal'
import type { DietaryLine, CuisineId, EmphasisId, FitnessGoal, OnboardingState } from '../types/profile'
import { Icon, FoodGlyph } from '../components/Icons'
import { useStore } from '../context/StoreContext'
import { buildProfile } from '../utils/profile'
import { batchPreview } from '../utils/mealPlan'

interface OnboardingProps {
  go: (r: AppRoute) => void
}

const CUISINES: { id: string; label: string; glyph: GlyphKind }[] = [
  { id: 'north_indian',    label: 'North Indian',    glyph: 'Roti'  },
  { id: 'south_indian',   label: 'South Indian',    glyph: 'Dome'  },
  { id: 'gujarati',       label: 'Gujarati',         glyph: 'Stack' },
  { id: 'bengali',        label: 'Bengali',          glyph: 'Bowl'  },
  { id: 'mediterranean',  label: 'Mediterranean',    glyph: 'Leaf'  },
  { id: 'thai',           label: 'Thai',             glyph: 'Pot'   },
  { id: 'mexican',        label: 'Mexican',          glyph: 'Cube'  },
  { id: 'japanese',       label: 'Japanese',         glyph: 'Rice'  },
]

const EMPHASIS: { id: string; label: string; glyph: GlyphKind }[] = [
  { id: 'high_protein', label: 'High protein',  glyph: 'Cube'  },
  { id: 'low_sugar',    label: 'Low sugar',      glyph: 'Leaf'  },
  { id: 'low_carb',     label: 'Lower carb',     glyph: 'Rice'  },
  { id: 'weight_loss',  label: 'Weight loss',    glyph: 'Bowl'  },
  { id: 'muscle',       label: 'Build muscle',   glyph: 'Pot'   },
  { id: 'gut',          label: 'Gut friendly',   glyph: 'Glass' },
]

const DIETS = ['Vegetarian', 'Vegan', 'Eggetarian', 'Non-vegetarian', 'Pescatarian']

interface OnboardState {
  diet: string
  cuisines: string[]
  emphasis: string[]
  household: number
  goalKcal: number
  cookTime: number
  batch: number
  allergies: string
  fitness?: string
}

const initialState: OnboardState = {
  diet:      'Vegetarian',
  cuisines:  ['north_indian', 'south_indian'],
  emphasis:  ['high_protein', 'low_sugar'],
  household: 2,
  goalKcal:  1900,
  cookTime:  30,
  batch:     3,
  allergies: 'Peanuts',
}

const STEPS = [
  { id: 'goals',    title: 'Your goals',         sub: 'We use these to balance your daily macros.'                    },
  { id: 'diet',     title: 'How you eat',         sub: 'Dietary line + cuisines you actually want this week.'         },
  { id: 'emphasis', title: 'What to emphasise',   sub: "Pick a couple — we'll bias the plan towards them."            },
  { id: 'kitchen',  title: 'Your kitchen',        sub: 'Household size, cook time, and anything to avoid.'            },
]

// ─── Step components ──────────────────────────────────────────────────────────

interface StepGoalsProps { s: OnboardState; set: (k: keyof OnboardState, v: unknown) => void }

function StepGoals({ s, set }: StepGoalsProps) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div className="col gap-6">
      <div>
        <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Daily calorie target
          <button
            type="button"
            className={`info-btn${showInfo ? ' on' : ''}`}
            onClick={() => setShowInfo((v) => !v)}
            aria-label="Learn about calorie targets">
            <Icon.Info size={14} />
          </button>
        </label>
        {showInfo && (
          <div className="info-card">
            <h5>Why we ask</h5>
            <p>Calories are the simplest knob for body composition. <strong>A deficit drives weight loss, a surplus drives gain.</strong> Hitting roughly the right total each day matters more than which exact foods make it up.</p>
            <p>Rough daily averages to <em>maintain</em> weight:</p>
            <ul>
              <li><strong>~2,000 kcal</strong> for an average adult woman</li>
              <li><strong>~2,500 kcal</strong> for an average adult man</li>
              <li>Active or larger-framed people may need <strong>300–500 more</strong></li>
            </ul>
            <p>For gentle weight loss (about ½ lb a week), aim ~250–500 kcal below your maintenance number. Avoid going below <strong>1,200 (women)</strong> or <strong>1,500 (men)</strong> without a clinician's nod.</p>
          </div>
        )}
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="muted" style={{ fontSize: 12 }}>1,200 kcal</span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{s.goalKcal.toLocaleString()} kcal / day</span>
          <span className="muted" style={{ fontSize: 12 }}>3,200 kcal</span>
        </div>
        <input className="slider" type="range" min="1200" max="3200" step="50"
          value={s.goalKcal} onChange={(e) => set('goalKcal', Number(e.target.value))} />
        <div className="field-hint">We calculate a reasonable starting point from your goals. You can change this any time.</div>
      </div>

      <div>
        <label className="field-label">Your fitness goal</label>
        <div className="choice-grid">
          {([
            { id: 'lose',        t: 'Lose weight',   s: 'Modest deficit'    },
            { id: 'maintain',    t: 'Maintain',       s: 'Steady eating'     },
            { id: 'muscle',      t: 'Build muscle',   s: 'Protein focused'   },
            { id: 'performance', t: 'Performance',    s: 'Endurance fuel'    },
          ] as const).map((g) => (
            <button key={g.id}
              className={`choice${s.fitness === g.id || (g.id === 'lose' && !s.fitness) ? ' selected' : ''}`}
              onClick={() => set('fitness', g.id)}>
              <div className="choice-title">{g.t}</div>
              <div className="choice-sub">{g.s}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface StepDietProps {
  s: OnboardState
  set: (k: keyof OnboardState, v: unknown) => void
  toggle: (k: keyof OnboardState, v: string) => void
}

function StepDiet({ s, set, toggle }: StepDietProps) {
  return (
    <div className="col gap-6">
      <div>
        <label className="field-label">Dietary line</label>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {DIETS.map((d) => (
            <button key={d}
              className={`chip${s.diet === d ? ' chip-paprika' : ''}`}
              onClick={() => set('diet', d)}
              style={{ cursor: 'pointer', border: 0 }}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="field-label">
          Cuisines you'd like this week <span className="muted" style={{ fontWeight: 400 }}>· pick 2–4</span>
        </label>
        <div className="choice-grid">
          {CUISINES.map((c) => {
            const selected = s.cuisines.includes(c.id)
            const tone: ColorTone = selected ? 'saffron' : 'paprika'
            return (
              <button key={c.id}
                className={`choice${selected ? ' selected' : ''}`}
                onClick={() => toggle('cuisines', c.id)}>
                <div className="choice-glyph"><FoodGlyph kind={c.glyph} tone={tone} size="sm" /></div>
                <div className="choice-title">{c.label}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface StepEmphasisProps {
  s: OnboardState
  toggle: (k: keyof OnboardState, v: string) => void
}

function StepEmphasis({ s, toggle }: StepEmphasisProps) {
  return (
    <div>
      <div className="choice-grid">
        {EMPHASIS.map((e) => {
          const selected = s.emphasis.includes(e.id)
          const tone: ColorTone = selected ? 'saffron' : 'olive'
          return (
            <button key={e.id}
              className={`choice${selected ? ' selected' : ''}`}
              onClick={() => toggle('emphasis', e.id)}>
              <div className="choice-glyph"><FoodGlyph kind={e.glyph} tone={tone} size="sm" /></div>
              <div className="choice-title">{e.label}</div>
            </button>
          )
        })}
      </div>
      <div className="field-hint mt-4">
        Selecting "High protein" raises your protein floor to ~25% of calories.
        Selecting "Low sugar" caps added sugar at 25g/day.
      </div>
    </div>
  )
}

interface StepKitchenProps {
  s: OnboardState
  set: (k: keyof OnboardState, v: unknown) => void
}

function StepKitchen({ s, set }: StepKitchenProps) {
  return (
    <div className="col gap-6">
      <div className="row between">
        <div>
          <div className="field-label" style={{ marginBottom: 0 }}>Household size</div>
          <div className="field-hint" style={{ marginTop: 4 }}>How many adults do you cook for?</div>
        </div>
        <div className="stepper">
          <button onClick={() => set('household', Math.max(1, s.household - 1))}>−</button>
          <span className="val">{s.household}</span>
          <button onClick={() => set('household', s.household + 1)}>+</button>
        </div>
      </div>

      <div>
        <label className="field-label">Max cooking time on a weekday</label>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="muted" style={{ fontSize: 12 }}>15 min</span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{s.cookTime} minutes</span>
          <span className="muted" style={{ fontSize: 12 }}>90 min</span>
        </div>
        <input className="slider" type="range" min="15" max="90" step="5"
          value={s.cookTime} onChange={(e) => set('cookTime', Number(e.target.value))} />
      </div>

      <div>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: 24 }}>
            <div className="field-label" style={{ marginBottom: 4 }}>Plan meals to last twice</div>
            <div className="field-hint" style={{ marginTop: 0 }}>
              How many dinners should stretch into the next day's lunch? Bigger batches mean fewer
              cook sessions and less waste — most couples land at 2–4.
            </div>
          </div>
          <div className="col gap-2" style={{ alignItems: 'flex-end' }}>
            <div className="stepper">
              <button onClick={() => set('batch', Math.max(0, s.batch - 1))}>−</button>
              <span className="val">{s.batch}</span>
              <button onClick={() => set('batch', Math.min(7, s.batch + 1))}>+</button>
            </div>
            <span className="mono muted" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              of 7 dinners
            </span>
          </div>
        </div>

        <div className="mt-4" style={{
          background: 'var(--bg-warm)', borderRadius: 10, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
        }}>
          <Icon.Sparkle size={14} />
          <span style={{ flex: 1, color: 'var(--ink-soft)' }}>{batchPreview(s.batch)}</span>
        </div>
      </div>

      <div>
        <label className="field-label">Allergies or anything to avoid</label>
        <input className="input" type="text" value={s.allergies}
          onChange={(e) => set('allergies', e.target.value)}
          placeholder="e.g. peanuts, mushrooms, eggplant" />
        <div className="field-hint">Free-text. Separate with commas.</div>
      </div>
    </div>
  )
}

// ─── Multi-step shell ─────────────────────────────────────────────────────────

function MultiStep({ go }: { go: (r: AppRoute) => void }) {
  const { onboardingState, setOnboardingState, setProfile } = useStore()

  const [step, setStep] = useState(0)
  // Seed form from previously saved state when re-entering the flow
  const [s, setS] = useState<OnboardState>(() => onboardingState ?? initialState)

  const set = (k: keyof OnboardState, v: unknown) => setS((p) => ({ ...p, [k]: v }))
  const toggle = (k: keyof OnboardState, v: string) =>
    setS((p) => {
      const arr = p[k] as string[]
      return { ...p, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] }
    })

  const handleGenerate = () => {
    const canonical: OnboardingState = {
      diet:      s.diet as DietaryLine,
      cuisines:  s.cuisines as CuisineId[],
      emphasis:  s.emphasis as EmphasisId[],
      household: s.household,
      goalKcal:  s.goalKcal,
      cookTime:  s.cookTime,
      batch:     s.batch,
      allergies: s.allergies,
      fitness:   s.fitness as FitnessGoal | undefined,
    }
    setOnboardingState(canonical)
    setProfile(buildProfile(canonical))
    go('loading')
  }

  const current = STEPS[step]

  return (
    <div className="onboard-shell">
      <div className="eyebrow mb-2">Step {step + 1} of {STEPS.length}</div>
      <div className="progress-bar">
        {STEPS.map((_, i) => (
          <div key={i} className={`seg-prog${i < step ? ' done' : i === step ? ' current' : ''}`} />
        ))}
      </div>

      <h1 className="h-1">{current.title}</h1>
      <p className="lead mt-2">{current.sub}</p>

      <div className="mt-6">
        {current.id === 'goals'    && <StepGoals    s={s} set={set} />}
        {current.id === 'diet'     && <StepDiet     s={s} set={set} toggle={toggle} />}
        {current.id === 'emphasis' && <StepEmphasis s={s} toggle={toggle} />}
        {current.id === 'kitchen'  && <StepKitchen  s={s} set={set} />}
      </div>

      <div className="onboard-actions">
        <button className="btn btn-ghost" onClick={() => step === 0 ? go('landing') : setStep(step - 1)}>
          <Icon.ArrowLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
        </button>
        <div className="row gap-3">
          <span className="muted" style={{ fontSize: 13 }}>{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Continue <Icon.Arrow />
            </button>
          ) : (
            <button className="btn btn-accent" onClick={handleGenerate}>
              <Icon.Sparkle /> Generate my week
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function Onboarding({ go }: OnboardingProps) {
  return (
    <div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 32px 0' }}>
        <button className="nav-link" onClick={() => go('landing')} style={{ paddingLeft: 0 }}>
          <Icon.ArrowLeft size={14} /> Back
        </button>
      </div>
      <MultiStep go={go} />
    </div>
  )
}
