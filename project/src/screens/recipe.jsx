// Recipe / meal detail view

const Recipe = ({ go }) => {
  const r = RECIPE;
  const { favorites, toggleFavorite, groceryEdits } = useStore();
  const isFav = favorites.has(r.id);
  const [servings, setServings] = React.useState(r.servings);

  // Pull active substitutions (renames in the grocery list) and map them to ingredients.
  const subs = Object.entries(groceryEdits)
    .filter(([orig, e]) => e?.name && e.name !== orig)
    .map(([orig, e]) => ({ original: orig, replacement: e.name }));
  const ingredientSub = {};
  subs.forEach((s) => {
    const keywords = s.original.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3);
    r.ingredients.forEach((ing, idx) => {
      const lower = ing.name.toLowerCase();
      if (keywords.some((w) => lower.includes(w))) ingredientSub[idx] = s;
    });
  });
  const ratio = servings / r.servings;
  const macroPercent = (g, total) => Math.round((g * 4 / r.nutrition.kcal) * 100);

  return (
    <div className="page">
      <button className="nav-link mb-4" onClick={() => go("dashboard")} style={{ paddingLeft: 0 }}>
        <Icon.ArrowLeft size={14} /> Back to this week
      </button>

      <div className="between mb-6" style={{ alignItems: "flex-end" }}>
        <div style={{ maxWidth: 700 }}>
          <div className="eyebrow mb-2">Tuesday · Lunch</div>
          <h1 className="h-1">{r.name}</h1>
          <p className="lead mt-2">{r.subtitle}</p>
          <div className="row gap-2 mt-4" style={{ flexWrap: "wrap" }}>
            {r.tags.map(t => <span key={t} className="chip">{t}</span>)}
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost btn-sm"><Icon.Swap /> Swap meal</button>
          <button
            className={`btn btn-sm ${isFav ? "btn-accent" : "btn-ghost"}`}
            onClick={() => toggleFavorite(r.id)}>
            <Icon.Heart size={14} filled={isFav} /> {isFav ? "Favorited" : "Favorite"}
          </button>
          <button className="btn btn-primary btn-sm"><Icon.Cart /> Add to grocery</button>
        </div>
      </div>

      <div className="recipe-grid">
        {/* LEFT */}
        <div>
          <div className="recipe-hero mb-6">
            <div className="placeholder-stripe"></div>
            <FoodGlyph kind="Cube" tone="paprika" size="lg" />
            <span className="ph-label">drop photo — paneer bhurji, top-down</span>
          </div>

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
              <div className="row gap-2">
                <div className="stepper">
                  <button onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
                  <span className="val">{servings}</span>
                  <button onClick={() => setServings(servings + 1)}>+</button>
                </div>
              </div>
            </div>
            <div>
              <div className="eyebrow mb-2">Per serving</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>
                {Math.round(r.nutrition.kcal)} <span className="mono muted" style={{ fontSize: 13 }}>kcal</span>
              </div>
            </div>
          </div>

          <h2 className="h-2 mb-4">Method</h2>
          <div>
            {r.steps.map((step, i) => (
              <div className="step" key={i}>
                <div className="step-num">{String(i + 1).padStart(2, "0")}</div>
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
                <div className="val">{r.nutrition.kcal}<span className="unit">kcal</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Protein</div>
                <div className="val">{r.nutrition.p}<span className="unit">g</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Carbs</div>
                <div className="val">{r.nutrition.c}<span className="unit">g</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Fat</div>
                <div className="val">{r.nutrition.fat}<span className="unit">g</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Sugar</div>
                <div className="val">{r.nutrition.sugar}<span className="unit">g</span></div>
              </div>
              <div className="nut-cell">
                <div className="lbl">Fibre</div>
                <div className="val">{r.nutrition.fiber}<span className="unit">g</span></div>
              </div>
            </div>

            <div className="mt-6">
              <div className="bar-row" style={{ marginBottom: 8 }}>
                <span className="lbl">Protein</span>
                <div className="macro-bar"><span className="fill" style={{ width: "25%", background: "var(--paprika)" }}></span></div>
                <span className="num">25%</span>
              </div>
              <div className="bar-row" style={{ marginBottom: 8 }}>
                <span className="lbl">Carbs</span>
                <div className="macro-bar"><span className="fill" style={{ width: "31%", background: "var(--saffron)" }}></span></div>
                <span className="num">31%</span>
              </div>
              <div className="bar-row">
                <span className="lbl">Fat</span>
                <div className="macro-bar"><span className="fill" style={{ width: "37%", background: "var(--olive)" }}></span></div>
                <span className="num">37%</span>
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
              {r.ingredients.map((ing, i) => {
                const sub = ingredientSub[i];
                return (
                  <div className="ingredient-row" key={i}>
                    <span>
                      {ing.name}
                      {sub && <span className="renamed-note">({sub.replacement.toLowerCase()})</span>}
                    </span>
                    <span className="amt">{scaleAmt(ing.amt, ratio)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-flat">
            <div className="eyebrow mb-2">Pairs well with</div>
            <div className="col gap-2 mt-2">
              {r.pairsWith.map(id => (
                <button key={id} className="row gap-3" onClick={() => go("recipe")}
                  style={{ padding: 10, background: "var(--surface)", borderRadius: 10, border: "1px solid var(--hairline)", textAlign: "left", cursor: "pointer", width: "100%" }}>
                  <FoodGlyph kind={MEALS[id].glyph} tone={MEALS[id].tone} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div className="serif" style={{ fontWeight: 500, fontSize: 14 }}>{MEALS[id].name}</div>
                    <div className="mono muted" style={{ fontSize: 11 }}>{MEALS[id].kcal} kcal · {MEALS[id].time} min</div>
                  </div>
                  <Icon.Arrow size={12} />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

// crude amount scaling that preserves the unit
const scaleAmt = (amt, ratio) => {
  if (ratio === 1) return amt;
  const m = amt.match(/^([\d.½¼¾⅓⅔]+)\s*(.*)$/);
  if (!m) return amt;
  const fracMap = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 0.333, "⅔": 0.667 };
  const num = fracMap[m[1]] || parseFloat(m[1]);
  if (isNaN(num)) return amt;
  const scaled = num * ratio;
  const rounded = scaled < 1 ? scaled.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") : Math.round(scaled * 10) / 10;
  return `${rounded} ${m[2]}`.trim();
};

window.Recipe = Recipe;
