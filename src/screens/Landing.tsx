import type { AppRoute } from '../types/store'
import { Icon, FoodGlyph } from '../components/Icons'
import { useStore } from '../context/StoreContext'

interface LandingProps {
  go: (r: AppRoute) => void
}

export function Landing({ go }: LandingProps) {
  const { signedIn, authLoading, generatedPlan, viewSamplePlan } = useStore()
  const hasExistingPlan = !authLoading && signedIn && generatedPlan !== null

  return (
    <div className="page">
      {/* HERO */}
      <section className="landing-hero">
        <div>
          <div className="row gap-2 mb-4">
            <span className="chip chip-saffron"><Icon.Sparkle size={12} /> Personalised, weekly</span>
          </div>
          <h1 className="h-display">
            Stop wondering<br />
            <em>what's for dinner.</em>
          </h1>
          <p className="lead mt-4">
            Tell us your goals, your kitchen, your taste. We'll plan a whole week of meals
            that hit your numbers and one tidy grocery list to shop from. No daily decisions,
            no surprise calories.
          </p>
          <div className="row gap-3 mt-6">
            {hasExistingPlan ? (
              <>
                <button className="btn btn-accent btn-lg" onClick={() => go('dashboard')}>
                  Your week's ready <Icon.Arrow />
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => go('onboarding')}>
                  Start fresh
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-accent btn-lg" onClick={() => go('onboarding')}>
                  Plan my week <Icon.Arrow />
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => { viewSamplePlan(); go('dashboard') }}>
                  See a sample plan
                </button>
              </>
            )}
          </div>
          <div className="row gap-4 mt-6 muted" style={{ fontSize: 13 }}>
            <span className="row gap-2"><Icon.Check size={12} /> Honors your dietary needs</span>
            <span className="row gap-2"><Icon.Check size={12} /> Macro-balanced by day</span>
            <span className="row gap-2"><Icon.Check size={12} /> Leftovers built in</span>
          </div>
        </div>

      </section>

      {/* FEATURE ROW */}
      <section className="feature-row">
        <div className="card">
          <FoodGlyph kind="Bowl" tone="paprika" />
          <h3 className="h-3 mt-4">Built around your macros</h3>
          <p className="muted mt-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
            Each day's meals balance to your protein, carb and sugar targets — not just calories.
            You see the math, not just the dish.
          </p>
        </div>
        <div className="card">
          <FoodGlyph kind="Leaf" tone="olive" />
          <h3 className="h-3 mt-4">Honest with leftovers</h3>
          <p className="muted mt-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
            Cook once, eat twice. Plans deliberately reuse what you've made — same flavours,
            fewer dishes, less waste.
          </p>
        </div>
        <div className="card">
          <FoodGlyph kind="Cube" tone="saffron" />
          <h3 className="h-3 mt-4">Swap, don't start over</h3>
          <p className="muted mt-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
            Don't feel like khichdi tonight? Tap swap and we'll offer three alternatives that
            keep your day's numbers intact.
          </p>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="workflow">
        <div className="between" style={{ alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow mb-2">How it works</div>
            <h2 className="h-1">Four steps. One <em>well-fed</em> week.</h2>
          </div>
          <span className="muted serif" style={{ fontStyle: 'italic' }}>About six minutes the first time.</span>
        </div>
        <div className="workflow-list">
          {[
            { n: '01', h: 'Tell us about you',    p: 'Calorie target, fitness goal, household size, and any allergies or dietary lines you don\'t cross.' },
            { n: '02', h: 'Pick your flavours',    p: 'Indian-leaning, low sugar, vegetarian, high protein — stack the preferences that matter to you.' },
            { n: '03', h: 'Generate a week',       p: 'Seven days of breakfast, lunch, snack, and dinner. Swap any meal you don\'t fancy with one tap.' },
            { n: '04', h: 'Shop once, cook calm',  p: 'Every ingredient rolled into one grocery list with exact amounts. Print it or tick as you go.' },
          ].map((s) => (
            <div className="workflow-step" key={s.n}>
              <div className="num">{s.n}</div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF / STATS */}
      <section className="proof">
        <h2 className="h-1" style={{ maxWidth: '16ch' }}>
          A kinder way to <em>eat the same week, twice.</em>
        </h2>
        <div className="proof-stat">
          <div className="num">~6 hrs</div>
          <div className="lbl">Saved per week</div>
        </div>
        <div className="proof-stat">
          <div className="num">28</div>
          <div className="lbl">Meals planned</div>
        </div>
        <div className="proof-stat">
          <div className="num">1</div>
          <div className="lbl">Trip to the shop</div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ marginTop: 80, padding: '48px 0 32px', textAlign: 'center' }}>
        <h2 className="h-display" style={{ fontSize: 48 }}>What's <em>cookin'?</em></h2>
        <p className="lead" style={{ margin: '12px auto 24px' }}>
          Six minutes from here to a week's worth of meals on your fridge.
        </p>
        <button className="btn btn-accent btn-lg" onClick={() => go(hasExistingPlan ? 'dashboard' : 'onboarding')}>
          {hasExistingPlan ? "Your week's ready" : 'Plan my week'} <Icon.Arrow />
        </button>
      </section>
    </div>
  )
}
