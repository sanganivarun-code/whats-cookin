// Onboarding — variations: multi-step (default) and single-page.

const CUISINES = [
  { id: "north_indian", label: "North Indian", glyph: "Roti" },
  { id: "south_indian", label: "South Indian", glyph: "Dome" },
  { id: "gujarati", label: "Gujarati", glyph: "Stack" },
  { id: "bengali", label: "Bengali", glyph: "Bowl" },
  { id: "mediterranean", label: "Mediterranean", glyph: "Leaf" },
  { id: "thai", label: "Thai", glyph: "Pot" },
  { id: "mexican", label: "Mexican", glyph: "Cube" },
  { id: "japanese", label: "Japanese", glyph: "Rice" },
];

const EMPHASIS = [
  { id: "high_protein", label: "High protein", glyph: "Cube" },
  { id: "low_sugar", label: "Low sugar", glyph: "Leaf" },
  { id: "low_carb", label: "Lower carb", glyph: "Rice" },
  { id: "weight_loss", label: "Weight loss", glyph: "Bowl" },
  { id: "muscle", label: "Build muscle", glyph: "Pot" },
  { id: "gut", label: "Gut friendly", glyph: "Glass" },
];

const DIETS = ["Vegetarian", "Vegan", "Eggetarian", "Non-vegetarian", "Pescatarian"];

// Default state
const initialState = {
  diet: "Vegetarian",
  cuisines: ["north_indian", "south_indian"],
  emphasis: ["high_protein", "low_sugar"],
  household: 2,
  goalKcal: 1900,
  cookTime: 30,
  batch: 3, // number of meals planned to last twice this week
  allergies: "Peanuts",
};

const Onboarding = ({ go }) => {
  return (
    <div>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 32px 0" }}>
        <button className="nav-link" onClick={() => go("landing")} style={{ paddingLeft: 0 }}>
          <Icon.ArrowLeft size={14} /> Back
        </button>
      </div>
      <MultiStep go={go} />
    </div>
  );
};

// Helper: human-readable preview of the batch number
const batchPreview = (n) => {
  if (n === 0) return "You'll cook every dinner fresh — 7 cook sessions a week.";
  if (n === 7) return "Every dinner gets stretched. Just 4 active cook days a week.";
  const sessions = 7 - Math.floor(n / 2);
  return `About ${sessions} active cook sessions a week. ${n} dinner${n > 1 ? "s" : ""} will reappear as next-day lunches.`;
};

// ───── Multi-step variation ─────
const STEPS = [
  { id: "goals", title: "Your goals", sub: "We use these to balance your daily macros." },
  { id: "diet", title: "How you eat", sub: "Dietary line + cuisines you actually want this week." },
  { id: "emphasis", title: "What to emphasise", sub: "Pick a couple — we'll bias the plan towards them." },
  { id: "kitchen", title: "Your kitchen", sub: "Household size, cook time, and anything to avoid." },
];

const MultiStep = ({ go }) => {
  const [step, setStep] = React.useState(0);
  const [s, setS] = React.useState(initialState);

  const set = (k, v) => setS(p => ({ ...p, [k]: v }));
  const toggle = (k, v) => setS(p => ({
    ...p,
    [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v],
  }));

  const current = STEPS[step];

  return (
    <div className="onboard-shell">
      <div className="eyebrow mb-2">Step {step + 1} of {STEPS.length}</div>
      <div className="progress-bar">
        {STEPS.map((_, i) => (
          <div key={i} className={`seg-prog ${i < step ? "done" : i === step ? "current" : ""}`}></div>
        ))}
      </div>

      <h1 className="h-1">{current.title}</h1>
      <p className="lead mt-2">{current.sub}</p>

      <div className="mt-6">
        {current.id === "goals" && <StepGoals s={s} set={set} />}
        {current.id === "diet" && <StepDiet s={s} set={set} toggle={toggle} />}
        {current.id === "emphasis" && <StepEmphasis s={s} toggle={toggle} />}
        {current.id === "kitchen" && <StepKitchen s={s} set={set} />}
      </div>

      <div className="onboard-actions">
        <button
          className="btn btn-ghost"
          onClick={() => step === 0 ? go("landing") : setStep(step - 1)}>
          <Icon.ArrowLeft size={14} /> {step === 0 ? "Cancel" : "Back"}
        </button>
        <div className="row gap-3">
          <span className="muted" style={{ fontSize: 13 }}>
            {step + 1} / {STEPS.length}
          </span>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Continue <Icon.Arrow />
            </button>
          ) : (
            <button className="btn btn-accent" onClick={() => go("loading")}>
              <Icon.Sparkle /> Generate my week
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const StepGoals = ({ s, set }) => {
  const [showInfo, setShowInfo] = React.useState(false);
  return (
    <div className="col gap-6">
      <div>
        <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Daily calorie target
          <button
            type="button"
            className={`info-btn ${showInfo ? "on" : ""}`}
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
          value={s.goalKcal} onChange={e => set("goalKcal", Number(e.target.value))} />
        <div className="field-hint">We calculate a reasonable starting point from your goals. You can change this any time.</div>
      </div>

    <div>
      <label className="field-label">Your fitness goal</label>
      <div className="choice-grid">
        {[
          { id: "lose", t: "Lose weight", s: "Modest deficit" },
          { id: "maintain", t: "Maintain", s: "Steady eating" },
          { id: "muscle", t: "Build muscle", s: "Protein focused" },
          { id: "performance", t: "Performance", s: "Endurance fuel" },
        ].map(g => (
          <button key={g.id}
            className={`choice ${s.fitness === g.id || (g.id === "lose" && !s.fitness) ? "selected" : ""}`}
            onClick={() => set("fitness", g.id)}>
            <div className="choice-title">{g.t}</div>
            <div className="choice-sub">{g.s}</div>
          </button>
        ))}
      </div>
    </div>
  </div>
  );
};

const StepDiet = ({ s, set, toggle }) => (
  <div className="col gap-6">
    <div>
      <label className="field-label">Dietary line</label>
      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
        {DIETS.map(d => (
          <button key={d}
            className={`chip ${s.diet === d ? "chip-paprika" : ""}`}
            onClick={() => set("diet", d)}
            style={{ cursor: "pointer", border: 0 }}>
            {d}
          </button>
        ))}
      </div>
    </div>
    <div>
      <label className="field-label">Cuisines you'd like this week <span className="muted" style={{ fontWeight: 400 }}>· pick 2–4</span></label>
      <div className="choice-grid">
        {CUISINES.map(c => (
          <button key={c.id}
            className={`choice ${s.cuisines.includes(c.id) ? "selected" : ""}`}
            onClick={() => toggle("cuisines", c.id)}>
            <div className="choice-glyph"><FoodGlyph kind={c.glyph} tone={s.cuisines.includes(c.id) ? "saffron" : "paprika"} size="sm" /></div>
            <div className="choice-title">{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const StepEmphasis = ({ s, toggle }) => (
  <div>
    <div className="choice-grid">
      {EMPHASIS.map(e => (
        <button key={e.id}
          className={`choice ${s.emphasis.includes(e.id) ? "selected" : ""}`}
          onClick={() => toggle("emphasis", e.id)}>
          <div className="choice-glyph"><FoodGlyph kind={e.glyph} tone={s.emphasis.includes(e.id) ? "saffron" : "olive"} size="sm" /></div>
          <div className="choice-title">{e.label}</div>
        </button>
      ))}
    </div>
    <div className="field-hint mt-4">
      Selecting "High protein" raises your protein floor to ~25% of calories. Selecting "Low sugar" caps added sugar at 25g/day.
    </div>
  </div>
);

const StepKitchen = ({ s, set }) => (
  <div className="col gap-6">
    <div className="row between">
      <div>
        <div className="field-label" style={{ marginBottom: 0 }}>Household size</div>
        <div className="field-hint" style={{ marginTop: 4 }}>How many adults do you cook for?</div>
      </div>
      <div className="stepper">
        <button onClick={() => set("household", Math.max(1, s.household - 1))}>−</button>
        <span className="val">{s.household}</span>
        <button onClick={() => set("household", s.household + 1)}>+</button>
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
        value={s.cookTime} onChange={e => set("cookTime", Number(e.target.value))} />
    </div>

    <div>
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1, paddingRight: 24 }}>
          <div className="field-label" style={{ marginBottom: 4 }}>Plan meals to last twice</div>
          <div className="field-hint" style={{ marginTop: 0 }}>
            How many dinners should stretch into the next day's lunch? Bigger
            batches mean fewer cook sessions and less waste — most couples
            land at 2–4.
          </div>
        </div>
        <div className="col gap-2" style={{ alignItems: "flex-end" }}>
          <div className="stepper">
            <button onClick={() => set("batch", Math.max(0, s.batch - 1))}>−</button>
            <span className="val">{s.batch}</span>
            <button onClick={() => set("batch", Math.min(7, s.batch + 1))}>+</button>
          </div>
          <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            of 7 dinners
          </span>
        </div>
      </div>

      <div className="mt-4" style={{
        background: "var(--bg-warm)",
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
      }}>
        <Icon.Sparkle size={14} />
        <span style={{ flex: 1, color: "var(--ink-soft)" }}>
          {batchPreview(s.batch)}
        </span>
      </div>
    </div>

    <div>
      <label className="field-label">Allergies or anything to avoid</label>
      <input className="input" type="text" value={s.allergies}
        onChange={e => set("allergies", e.target.value)}
        placeholder="e.g. peanuts, mushrooms, eggplant" />
      <div className="field-hint">Free-text. Separate with commas.</div>
    </div>
  </div>
);

window.Onboarding = Onboarding;
