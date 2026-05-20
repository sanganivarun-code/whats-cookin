// Landing page

const Landing = ({ go }) => {
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
            Tell us your goals, your kitchen, your taste. We'll plan a whole
            week of meals that hit your numbers and one tidy grocery list to
            shop from. No daily decisions, no surprise calories.
          </p>
          <div className="row gap-3 mt-6">
            <button className="btn btn-accent btn-lg" onClick={() => go("onboarding")}>
              Plan my week <Icon.Arrow />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => go("dashboard")}>
              See a sample plan
            </button>
          </div>
          <div className="row gap-4 mt-6 muted" style={{ fontSize: 13 }}>
            <span className="row gap-2"><Icon.Check size={12} /> Honors your dietary needs</span>
            <span className="row gap-2"><Icon.Check size={12} /> Macro-balanced by day</span>
            <span className="row gap-2"><Icon.Check size={12} /> Leftovers built in</span>
          </div>
        </div>

        {/* Hero composition: a “plan card” preview */}
        <div className="lh-art">
          <HeroPreview />
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="workflow">
        <div className="between" style={{ alignItems: "flex-end" }}>
          <div>
            <div className="eyebrow mb-2">How it works</div>
            <h2 className="h-1">Four steps. One <em>well-fed</em> week.</h2>
          </div>
          <span className="muted serif" style={{ fontStyle: "italic" }}>About six minutes the first time.</span>
        </div>
        <div className="workflow-list">
          {[
            { n: "01", h: "Tell us about you", p: "Calorie target, fitness goal, household size, and any allergies or dietary lines you don't cross." },
            { n: "02", h: "Pick your flavours", p: "Indian-leaning, low sugar, vegetarian, high protein — stack the preferences that matter to you." },
            { n: "03", h: "Generate a week", p: "Seven days of breakfast, lunch, snack, and dinner. Swap any meal you don't fancy with one tap." },
            { n: "04", h: "Shop once, cook calm", p: "Every ingredient rolled into one grocery list with exact amounts. Print it or tick as you go." },
          ].map(s => (
            <div className="workflow-step" key={s.n}>
              <div className="num">{s.n}</div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE ROW */}
      <section className="feature-row">
        <div className="card">
          <FoodGlyph kind="Bowl" tone="paprika" />
          <h3 className="h-3 mt-4">Built around your macros</h3>
          <p className="muted mt-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
            Each day's meals balance to your protein, carb and sugar targets — not just calories. You see the math, not just the dish.
          </p>
        </div>
        <div className="card">
          <FoodGlyph kind="Leaf" tone="olive" />
          <h3 className="h-3 mt-4">Honest with leftovers</h3>
          <p className="muted mt-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
            Cook once, eat twice. Plans deliberately reuse what you've made — same flavours, fewer dishes, less waste.
          </p>
        </div>
        <div className="card">
          <FoodGlyph kind="Cube" tone="saffron" />
          <h3 className="h-3 mt-4">Swap, don't start over</h3>
          <p className="muted mt-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
            Don't feel like khichdi tonight? Tap swap and we'll offer three alternatives that keep your day's numbers intact.
          </p>
        </div>
      </section>

      {/* PROOF / STATS */}
      <section className="proof">
        <h2 className="h-1" style={{ maxWidth: "16ch" }}>
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
      <section style={{ marginTop: 80, padding: "48px 0 32px", textAlign: "center" }}>
        <h2 className="h-display" style={{ fontSize: 48 }}>What's <em>cookin'?</em></h2>
        <p className="lead" style={{ margin: "12px auto 24px" }}>
          Six minutes from here to a week's worth of meals on your fridge.
        </p>
        <button className="btn btn-accent btn-lg" onClick={() => go("onboarding")}>
          Plan my week <Icon.Arrow />
        </button>
      </section>
    </div>
  );
};

// Inline hero composition — a preview card for a single day
const HeroPreview = () => {
  return (
    <div style={{ position: "absolute", inset: 0, padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="row between" style={{ width: "100%" }}>
        <div>
          <div className="eyebrow" style={{ fontSize: 10 }}>Tuesday · May 20</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 2 }}>Today's plate</div>
        </div>
        <span className="chip chip-paprika"><span className="dot" /> On track</span>
      </div>

      {[
        { eyebrow: "Breakfast", glyph: "Rice", tone: "saffron", name: "Veg Poha with Peanuts", k: 380, p: 12 },
        { eyebrow: "Lunch", glyph: "Bowl", tone: "paprika", name: "Chana Masala + Quinoa", k: 580, p: 28 },
        { eyebrow: "Snack", glyph: "Glass", tone: "olive", name: "Spiced Buttermilk", k: 80, p: 4 },
        { eyebrow: "Dinner", glyph: "Cube", tone: "paprika", name: "Tofu Tikka + Brown Rice", k: 590, p: 38 },
      ].map((m, i) => (
        <div key={i} style={{
          display: "grid",
          gridTemplateColumns: "44px 1fr auto",
          gap: 12,
          alignItems: "center",
          background: "var(--surface)",
          borderRadius: 12,
          padding: "10px 14px",
          border: "1px solid var(--hairline)",
        }}>
          <FoodGlyph kind={m.glyph} tone={m.tone} size="sm" />
          <div>
            <div className="eyebrow" style={{ fontSize: 9 }}>{m.eyebrow}</div>
            <div className="serif" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>{m.name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{m.k}</div>
            <div className="mono muted" style={{ fontSize: 10 }}>{m.p}g P</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "auto", padding: "12px 14px", background: "var(--ink)", color: "var(--bg)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--saffron-soft)", fontSize: 10 }}>Day total</div>
          <div className="serif" style={{ fontSize: 18, fontWeight: 500, marginTop: 2 }}>1,630 kcal · 82g protein</div>
        </div>
        <span className="mono" style={{ fontSize: 11, color: "var(--saffron-soft)" }}>−270 from target</span>
      </div>
    </div>
  );
};

window.Landing = Landing;
