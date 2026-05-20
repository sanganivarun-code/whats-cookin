// Sign-in / sign-up modal + meal edit sheet (the two app-wide overlays).

// ───── Auth modal ─────
const AuthModal = () => {
  const { authOpen, setAuthOpen, signIn, user } = useStore();
  const [mode, setMode] = React.useState("signin"); // signin | signup
  const [email, setEmail] = React.useState(user.email);
  if (!authOpen) return null;

  return (
    <div className="overlay" onClick={() => setAuthOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <button className="modal-close" onClick={() => setAuthOpen(false)}><Icon.X /></button>
        <div className="eyebrow mb-2">{mode === "signin" ? "Welcome back" : "Create account"}</div>
        <h2 className="h-1" style={{ fontSize: 30 }}>
          {mode === "signin" ? <>Save your week.</> : <>Start <em>cookin'.</em></>}
        </h2>
        <p className="muted mt-2" style={{ fontSize: 14 }}>
          {mode === "signin"
            ? "Sign in to sync plans, favorites and grocery lists across devices."
            : "Free to start. Your preferences and meal plans get saved to the cloud."}
        </p>

        <div className="col gap-2 mt-6">
          <button className="btn btn-ghost" style={{ justifyContent: "center", width: "100%", padding: "12px" }}>
            <GoogleG /> Continue with Google
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: "center", width: "100%", padding: "12px" }}>
            <AppleLogo /> Continue with Apple
          </button>
        </div>

        <div className="divider"><span>or with email</span></div>

        <div className="col gap-3">
          <div>
            <label className="field-label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="input" type="password" defaultValue="••••••••" placeholder="At least 8 characters" />
          </div>
        </div>

        <button className="btn btn-accent mt-4" style={{ width: "100%", justifyContent: "center", padding: "12px" }} onClick={signIn}>
          {mode === "signin" ? "Sign in" : "Create my account"} <Icon.Arrow />
        </button>

        <div className="muted mt-6" style={{ fontSize: 13, textAlign: "center" }}>
          {mode === "signin" ? (
            <>New here? <button className="text-link" onClick={() => setMode("signup")}>Create account</button></>
          ) : (
            <>Already have one? <button className="text-link" onClick={() => setMode("signin")}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
};

const GoogleG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.6c-.2 1.3-1 2.4-2 3.2v2.6h3.3c1.9-1.8 3.1-4.4 3.1-7.8z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.6c-.9.6-2 1-3.3 1-2.6 0-4.7-1.7-5.5-4.1H3.2v2.6C4.9 19.7 8.2 22 12 22z"/><path fill="#FBBC05" d="M6.5 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.5H3.2C2.4 9 2 10.4 2 12s.4 3 1.2 4.5l3.3-2.6z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3 14.7 2 12 2 8.2 2 4.9 4.3 3.2 7.5l3.3 2.6C7.3 7.7 9.4 6 12 6z"/></svg>
);

const AppleLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 12.04c0-2.94 2.41-4.36 2.52-4.42-1.38-2.01-3.52-2.29-4.28-2.32-1.82-.19-3.55 1.07-4.47 1.07-.93 0-2.34-1.05-3.86-1.02-1.98.03-3.82 1.15-4.84 2.93-2.07 3.58-.53 8.86 1.49 11.77.99 1.42 2.16 3.02 3.7 2.96 1.49-.06 2.05-.96 3.85-.96 1.79 0 2.31.96 3.88.93 1.6-.03 2.62-1.45 3.6-2.87 1.13-1.65 1.6-3.25 1.63-3.33-.04-.02-3.13-1.2-3.16-4.74zM14.6 4.05c.82-1 1.38-2.39 1.23-3.78-1.18.05-2.62.79-3.47 1.79-.76.88-1.43 2.29-1.25 3.65 1.32.1 2.66-.67 3.49-1.66z"/>
  </svg>
);

// ───── Meal edit sheet (manual add/remove/swap) ─────
const MealEditSheet = ({ go }) => {
  const { editTarget, setEditTarget, setOverride, getOverride, favorites } = useStore();
  const [customName, setCustomName] = React.useState("");
  const [showCustom, setShowCustom] = React.useState(false);

  if (!editTarget) return null;

  const { dayIndex, slot } = editTarget;
  const day = DAYS[dayIndex];
  const planDay = PLAN[dayIndex];
  const override = getOverride(dayIndex, slot);
  const plannedMeal = !override || override.kind === "default" ? MEALS[planDay[slot]] : null;
  const slotLabel = { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" }[slot];

  const close = () => { setEditTarget(null); setShowCustom(false); setCustomName(""); };
  const apply = (val) => { setOverride(dayIndex, slot, val); close(); };

  return (
    <div className="overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close}><Icon.X /></button>
        <div className="eyebrow mb-2">{day.name} · {slotLabel}</div>
        <h3 className="h-2 mb-2">
          {plannedMeal ? plannedMeal.name : override?.name || "Open slot"}
        </h3>
        <p className="muted" style={{ fontSize: 13 }}>
          What would you like to do with this meal?
        </p>

        {!showCustom ? (
          <div className="action-list mt-4">
            {plannedMeal && (
              <button className="action-row" onClick={() => { close(); go("recipe"); }}>
                <FoodGlyph kind={plannedMeal.glyph} tone={plannedMeal.tone} size="sm" />
                <div className="action-text">
                  <div className="action-title">View recipe</div>
                  <div className="action-sub">Ingredients, method, nutrition</div>
                </div>
                <Icon.Arrow size={14} />
              </button>
            )}
            {plannedMeal && (
              <button className="action-row" onClick={() => apply({ kind: "default" })}>
                <div className="action-icon"><Icon.Swap size={16} /></div>
                <div className="action-text">
                  <div className="action-title">Swap to something else</div>
                  <div className="action-sub">We'll suggest three alternatives that fit the day's macros</div>
                </div>
                <Icon.Arrow size={14} />
              </button>
            )}
            <button className="action-row" onClick={() => apply({ kind: "eating-out" })}>
              <div className="action-icon"><Icon.Out size={16} /></div>
              <div className="action-text">
                <div className="action-title">Eating out</div>
                <div className="action-sub">Skip this slot — we won't add it to your grocery list</div>
              </div>
              <Icon.Arrow size={14} />
            </button>
            <button className="action-row" onClick={() => setShowCustom(true)}>
              <div className="action-icon"><Icon.Chef size={16} /></div>
              <div className="action-text">
                <div className="action-title">I'll cook my own</div>
                <div className="action-sub">Add a dish name — we'll leave the recipe to you</div>
              </div>
              <Icon.Arrow size={14} />
            </button>
            <button className="action-row danger" onClick={() => apply({ kind: "removed" })}>
              <div className="action-icon"><Icon.Trash size={16} /></div>
              <div className="action-text">
                <div className="action-title">Remove from plan</div>
                <div className="action-sub">Leave this slot empty</div>
              </div>
              <Icon.Arrow size={14} />
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <label className="field-label">What are you cooking?</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Spaghetti aglio e olio"
              value={customName}
              autoFocus
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && customName.trim() && apply({ kind: "self-cook", name: customName.trim() })}
            />
            <div className="field-hint">We'll keep this slot in your plan but skip ingredients in the grocery list.</div>
            <div className="row gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setShowCustom(false)}>
                <Icon.ArrowLeft size={14} /> Back
              </button>
              <button
                className="btn btn-accent"
                disabled={!customName.trim()}
                style={!customName.trim() ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                onClick={() => apply({ kind: "self-cook", name: customName.trim() })}>
                Add to plan
              </button>
            </div>

            {favorites.size > 0 && (
              <div className="mt-6" style={{ paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
                <div className="eyebrow mb-2">Or pick from favorites</div>
                <div className="col gap-2">
                  {[...favorites].map((id) => {
                    const m = MEALS[id];
                    if (!m) return null;
                    return (
                      <button key={id} className="row gap-3" style={{ padding: 10, background: "var(--surface)", borderRadius: 10, border: "1px solid var(--hairline)", textAlign: "left", cursor: "pointer", width: "100%" }}
                        onClick={() => apply({ kind: "custom", mealId: id, name: m.name })}>
                        <FoodGlyph kind={m.glyph} tone={m.tone} size="sm" />
                        <div style={{ flex: 1 }}>
                          <div className="serif" style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</div>
                          <div className="mono muted" style={{ fontSize: 11 }}>{m.kcal} kcal · {m.p}g protein</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

window.AuthModal = AuthModal;
window.MealEditSheet = MealEditSheet;
