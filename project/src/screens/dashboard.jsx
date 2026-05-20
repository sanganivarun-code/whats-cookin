// Weekly plan dashboard — three layout variations + overrides + favorites.

const Dashboard = ({ go }) => {
  const [view, setView] = React.useState("calendar"); // calendar | grid | list
  const { signedIn, setAuthOpen, planSaved, favorites, toggleFavorite, getOverride, setEditTarget } = useStore();

  // compute week totals (respecting overrides)
  const dayTotals = PLAN.map((day, i) => {
    return MEAL_SLOTS.reduce((acc, s) => {
      const ov = getOverride(i, s.key);
      if (ov?.kind === "removed" || ov?.kind === "eating-out") return acc;
      // self-cook + custom we count visually but skip macros
      const mealId = ov?.kind === "custom" ? ov.mealId : day[s.key];
      const m = MEALS[mealId];
      if (!m) return acc;
      return { kcal: acc.kcal + m.kcal, p: acc.p + m.p };
    }, { kcal: 0, p: 0 });
  });
  const avgKcal = Math.round(dayTotals.reduce((s, d) => s + d.kcal, 0) / 7);
  const avgP = Math.round(dayTotals.reduce((s, d) => s + d.p, 0) / 7);

  return (
    <div className="page">
      {/* Save plan banner */}
      {!signedIn ? (
        <div className="save-banner">
          <div className="left">
            <Icon.Lock />
            <span>This plan is in your browser only. <em>Sign in</em> to save it, sync across devices, and keep your favorites.</span>
          </div>
          <div className="row gap-2">
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--bg)", borderColor: "rgba(250,246,239,0.3)" }} onClick={() => setAuthOpen(true)}>
              Create account
            </button>
            <button className="btn btn-accent btn-sm" onClick={() => setAuthOpen(true)}>Sign in</button>
          </div>
        </div>
      ) : planSaved && (
        <div className="row gap-2 mb-4">
          <span className="save-status"><span className="dot"></span> Saved · synced 2 minutes ago</span>
          <span className="muted" style={{ fontSize: 12 }}>· May 19 plan</span>
        </div>
      )}

      <PageHeader
        eyebrow="This week · May 19 – 25"
        title={<>A week for <em>Aanya & Rohan</em></>}
        sub="Vegetarian · high protein · capped sugar. Two servings of every meal so dinners flow into next-day lunches where it makes sense."
        actions={<>
          <button className="btn btn-ghost btn-sm"><Icon.Sparkle /> Regenerate</button>
          <button className="btn btn-primary btn-sm" onClick={() => go("grocery")}>
            <Icon.Cart /> Grocery list
          </button>
        </>}
      />

      {/* View toggle */}
      <div className="between mb-4">
        <div className="row gap-3">
          <div className="seg">
            <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>Calendar</button>
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>Grid</button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
          </div>
          <span className="muted" style={{ fontSize: 13 }}>
            {view === "calendar" && "Day-by-day with all four meals · click any to edit"}
            {view === "grid" && "Each dish as a card, grouped by day"}
            {view === "list" && "Compact rundown, easiest to scan"}
          </span>
        </div>
        <div className="row gap-2">
          <span className="chip"><span className="dot" style={{ background: "var(--paprika)" }}></span> Today</span>
          <span className="chip"><span className="dot" style={{ background: "var(--olive)" }}></span> Leftover</span>
          <span className="chip"><Icon.Heart size={10} /> {favorites.size} favorited</span>
        </div>
      </div>

      {view === "calendar" && <CalendarView go={go} />}
      {view === "grid" && <GridView go={go} />}
      {view === "list" && <ListView go={go} />}
    </div>
  );
};

const MEAL_SLOTS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "snack", label: "Snack" },
  { key: "dinner", label: "Dinner" },
];

// Resolve a meal slot given overrides
const resolveSlot = (dayIndex, slot, override, planDay) => {
  if (override) return { kind: override.kind, meal: override.mealId ? MEALS[override.mealId] : null, name: override.name };
  const meal = MEALS[planDay[slot]];
  if (!meal) return null;
  return { kind: "default", meal };
};

// ─────────── CALENDAR (default) ───────────
const CalendarView = ({ go }) => {
  const { favorites, toggleFavorite, getOverride, setEditTarget } = useStore();

  return (
    <div className="week-grid">
      {DAYS.map((day, i) => {
        const isToday = i === TODAY_INDEX;
        const planDay = PLAN[i];
        let dayKcal = 0;
        let dayP = 0;

        return (
          <div key={day.name} className={`day-col ${isToday ? "today" : ""}`}>
            <div className="day-head">
              <div>
                <div className="day-name">{day.short}</div>
                <div className="day-date">{day.date}</div>
              </div>
              {isToday && <span className="mono" style={{ fontSize: 9, color: "var(--paprika)", letterSpacing: "0.1em" }}>TODAY</span>}
            </div>

            {planDay.leftover && (
              <button className="meal-card leftover" onClick={() => go("recipe")}>
                <span className="meal-eyebrow"><Icon.Leaf size={10} /> Leftover lunch</span>
                <span className="meal-name">{MEALS[planDay.leftover].name}</span>
                <span className="meal-kcal">{MEALS[planDay.leftover].kcal} kcal</span>
              </button>
            )}

            {MEAL_SLOTS.map((slot) => {
              // hide lunch slot if there's a leftover
              if (slot.key === "lunch" && planDay.leftover) return null;
              const override = getOverride(i, slot.key);
              const meal = MEALS[planDay[slot.key]];

              if (override?.kind === "removed") {
                return (
                  <button key={slot.key} className="meal-card removed" onClick={() => setEditTarget({ dayIndex: i, slot: slot.key })}>
                    <span className="meal-eyebrow">{slot.label}</span>
                    <span className="row gap-2" style={{ fontSize: 12 }}>
                      <Icon.Plus size={12} /> Add a meal
                    </span>
                  </button>
                );
              }

              if (override?.kind === "eating-out") {
                return (
                  <div key={slot.key} className="meal-card eating-out" style={{ position: "relative" }}>
                    <button className="meal-menu-btn" style={{ position: "absolute", top: 6, right: 6 }}
                      onClick={(e) => { e.stopPropagation(); setEditTarget({ dayIndex: i, slot: slot.key }); }}>
                      <Icon.Dots />
                    </button>
                    <span className="meal-eyebrow">{slot.label}</span>
                    <span className="meal-name" style={{ fontStyle: "italic" }}>Eating out</span>
                    <span className="meal-kcal muted">— skipped —</span>
                  </div>
                );
              }

              if (override?.kind === "self-cook" || override?.kind === "custom") {
                const m = override.kind === "custom" ? MEALS[override.mealId] : null;
                if (m) { dayKcal += m.kcal; dayP += m.p; }
                return (
                  <div key={slot.key} className="meal-card self-cook" style={{ position: "relative" }}>
                    <button className="meal-menu-btn" style={{ position: "absolute", top: 6, right: 6 }}
                      onClick={(e) => { e.stopPropagation(); setEditTarget({ dayIndex: i, slot: slot.key }); }}>
                      <Icon.Dots />
                    </button>
                    <span className="meal-eyebrow"><Icon.Chef size={10} /> {slot.label}</span>
                    <span className="meal-name">{override.name}</span>
                    <span className="meal-kcal muted">{m ? `${m.kcal} kcal · ${m.p}g P` : "your recipe"}</span>
                  </div>
                );
              }

              if (!meal) return null;
              dayKcal += meal.kcal;
              dayP += meal.p;
              const isFav = favorites.has(meal.id);

              return (
                <div key={slot.key} className="meal-card" style={{ position: "relative" }}>
                  <div className="meal-actions">
                    <button className={`heart-btn ${isFav ? "on" : ""}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(meal.id); }}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}>
                      <Icon.Heart filled={isFav} size={12} />
                    </button>
                    <button className="meal-menu-btn"
                      onClick={(e) => { e.stopPropagation(); setEditTarget({ dayIndex: i, slot: slot.key }); }}
                      title="Edit meal">
                      <Icon.Dots />
                    </button>
                  </div>
                  <button onClick={() => go("recipe")} style={{ background: "transparent", border: 0, padding: 0, textAlign: "left", display: "flex", flexDirection: "column", gap: 6, color: "inherit", fontFamily: "inherit", cursor: "pointer", width: "100%" }}>
                    <span className="meal-eyebrow">{slot.label}</span>
                    <span className="meal-name">{meal.name}</span>
                    <span className="meal-kcal">{meal.kcal} kcal · {meal.p}g P</span>
                  </button>
                </div>
              );
            })}

            <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-soft)" }}>
              <span>{dayKcal.toLocaleString()} kcal</span>
              <span>{dayP}g P</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────── GRID ───────────
const GridView = ({ go }) => {
  const { favorites, toggleFavorite, getOverride, setEditTarget } = useStore();

  return (
    <div className="col gap-6">
      {DAYS.map((day, i) => {
        const isToday = i === TODAY_INDEX;
        const planDay = PLAN[i];
        const dishes = [];
        if (planDay.leftover) dishes.push({ meal: MEALS[planDay.leftover], slot: "Lunch · leftover", slotKey: "lunch-leftover" });
        MEAL_SLOTS.forEach((slot) => {
          if (slot.key === "lunch" && planDay.leftover) return;
          const override = getOverride(i, slot.key);
          if (override?.kind === "removed") return;
          if (override?.kind === "eating-out") {
            dishes.push({ eatingOut: true, slot: slot.label, slotKey: slot.key });
            return;
          }
          if (override?.kind === "self-cook" || override?.kind === "custom") {
            const m = override.kind === "custom" ? MEALS[override.mealId] : null;
            dishes.push({ selfCook: true, name: override.name, meal: m, slot: slot.label, slotKey: slot.key });
            return;
          }
          const meal = MEALS[planDay[slot.key]];
          if (meal) dishes.push({ meal, slot: slot.label, slotKey: slot.key });
        });

        const totalKcal = dishes.reduce((s, d) => s + (d.meal?.kcal || 0), 0);
        const totalP = dishes.reduce((s, d) => s + (d.meal?.p || 0), 0);

        return (
          <div key={day.name}>
            <div className="between mb-2" style={{ paddingBottom: 8, borderBottom: "1px solid var(--hairline)" }}>
              <div className="row gap-3" style={{ alignItems: "baseline" }}>
                <span className="serif" style={{ fontSize: 22, fontWeight: 500, color: isToday ? "var(--paprika)" : "var(--ink)" }}>
                  {day.name}
                </span>
                <span className="mono muted" style={{ fontSize: 12 }}>{day.date}</span>
                {isToday && <span className="chip chip-paprika">Today</span>}
              </div>
              <span className="mono muted" style={{ fontSize: 12 }}>
                {totalKcal.toLocaleString()} kcal · {totalP}g P
              </span>
            </div>

            <div className="dish-grid">
              {dishes.map((d, j) => {
                if (d.eatingOut) {
                  return (
                    <div key={j} className="dish-card" style={{ borderStyle: "dashed", borderColor: "var(--saffron)" }}>
                      <div className="dish-when">{d.slot}</div>
                      <div className="dish-name" style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>Eating out</div>
                      <span className="muted" style={{ fontSize: 12 }}>Not counted in nutrition or groceries.</span>
                      <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}
                        onClick={() => setEditTarget({ dayIndex: i, slot: d.slotKey })}>
                        Change
                      </button>
                    </div>
                  );
                }
                if (d.selfCook) {
                  const m = d.meal;
                  return (
                    <div key={j} className="dish-card" style={{ background: "var(--olive-soft)", border: "0" }}>
                      <div className="dish-head">
                        <div style={{ flex: 1 }}>
                          <div className="dish-when"><Icon.Chef size={10} /> {d.slot} · your recipe</div>
                          <div className="dish-name">{d.name}</div>
                        </div>
                      </div>
                      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                        {m && <span className="chip">{m.kcal} kcal</span>}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}
                        onClick={() => setEditTarget({ dayIndex: i, slot: d.slotKey })}>
                        Change
                      </button>
                    </div>
                  );
                }
                const isFav = d.meal ? favorites.has(d.meal.id) : false;
                return (
                  <div key={j} className="dish-card" style={{ position: "relative" }}>
                    <div className="meal-actions">
                      {d.meal && (
                        <button className={`heart-btn ${isFav ? "on" : ""}`}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(d.meal.id); }}>
                          <Icon.Heart filled={isFav} size={12} />
                        </button>
                      )}
                      {d.slotKey !== "lunch-leftover" && (
                        <button className="meal-menu-btn"
                          onClick={(e) => { e.stopPropagation(); setEditTarget({ dayIndex: i, slot: d.slotKey }); }}>
                          <Icon.Dots />
                        </button>
                      )}
                    </div>
                    <button onClick={() => go("recipe")} style={{ background: "transparent", border: 0, padding: 0, textAlign: "left", display: "flex", flexDirection: "column", gap: 10, color: "inherit", fontFamily: "inherit", cursor: "pointer", width: "100%" }}>
                      <div className="dish-head">
                        <div style={{ flex: 1 }}>
                          <div className="dish-when">{d.slot}</div>
                          <div className="dish-name">{d.meal.name}</div>
                        </div>
                        <FoodGlyph kind={d.meal.glyph} tone={d.meal.tone} size="sm" />
                      </div>
                      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                        <span className="chip"><Icon.Clock size={10} /> {d.meal.time} min</span>
                        <span className="chip"><Icon.Flame size={10} /> {d.meal.kcal}</span>
                      </div>
                      <div className="dish-foot">
                        <span>{d.meal.p}g P · {d.meal.c}g C · {d.meal.fat}g F</span>
                        <Icon.Arrow size={12} />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────── LIST ───────────
const ListView = ({ go }) => {
  const { getOverride, setEditTarget } = useStore();

  return (
    <div className="day-list">
      {DAYS.map((day, i) => {
        const isToday = i === TODAY_INDEX;
        const planDay = PLAN[i];
        let dayKcal = 0;
        let dayP = 0;
        const meals = [];
        if (planDay.leftover) {
          const m = MEALS[planDay.leftover];
          dayKcal += m.kcal; dayP += m.p;
          meals.push({ meal: m, slot: "L (leftover)", slotKey: "lunch-leftover" });
        }
        MEAL_SLOTS.forEach((slot) => {
          if (slot.key === "lunch" && planDay.leftover) return;
          const override = getOverride(i, slot.key);
          if (override?.kind === "removed") return;
          if (override?.kind === "eating-out") {
            meals.push({ eatingOut: true, slot: slot.label[0], slotKey: slot.key });
            return;
          }
          if (override?.kind === "self-cook" || override?.kind === "custom") {
            const m = override.kind === "custom" ? MEALS[override.mealId] : null;
            if (m) { dayKcal += m.kcal; dayP += m.p; }
            meals.push({ selfCook: true, name: override.name, meal: m, slot: slot.label[0], slotKey: slot.key });
            return;
          }
          const meal = MEALS[planDay[slot.key]];
          if (meal) { dayKcal += meal.kcal; dayP += meal.p; meals.push({ meal, slot: slot.label[0], slotKey: slot.key }); }
        });

        return (
          <div key={day.name} className={`list-row ${isToday ? "today" : ""}`}>
            <div>
              <div className="list-day">{day.name}</div>
              <div className="list-day-date">{day.date}{isToday ? " · today" : ""}</div>
            </div>
            <div className="list-meals">
              {meals.map((m, j) => {
                if (m.eatingOut) {
                  return (
                    <button key={j} className="list-meal" style={{ background: "transparent", border: "1px dashed var(--saffron)" }}
                      onClick={() => setEditTarget({ dayIndex: i, slot: m.slotKey })}>
                      <span className="mono muted" style={{ fontSize: 10 }}>{m.slot}</span>
                      <span className="serif" style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>Eating out</span>
                    </button>
                  );
                }
                if (m.selfCook) {
                  return (
                    <button key={j} className="list-meal" style={{ background: "var(--olive-soft)" }}
                      onClick={() => setEditTarget({ dayIndex: i, slot: m.slotKey })}>
                      <Icon.Chef size={12} />
                      <span className="mono muted" style={{ fontSize: 10 }}>{m.slot}</span>
                      <span className="serif" style={{ fontWeight: 500 }}>{m.name}</span>
                    </button>
                  );
                }
                return (
                  <button key={j} className="list-meal" onClick={() => go("recipe")}>
                    <FoodGlyph kind={m.meal.glyph} tone={m.meal.tone} size="sm" />
                    <span className="mono muted" style={{ fontSize: 10, letterSpacing: "0.08em" }}>{m.slot}</span>
                    <span className="serif" style={{ fontWeight: 500 }}>{m.meal.name}</span>
                  </button>
                );
              })}
            </div>
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "right", minWidth: 110 }}>
              {dayKcal.toLocaleString()} kcal<br />
              <span className="muted">{dayP}g protein</span>
            </span>
            <button className="btn btn-ghost btn-sm"><Icon.Swap /> Swap day</button>
          </div>
        );
      })}
    </div>
  );
};

window.Dashboard = Dashboard;
