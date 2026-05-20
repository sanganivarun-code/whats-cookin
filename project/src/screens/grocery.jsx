// Grocery list — by section / by store, with tags, pantry adjustments, and edit/add/remove.

const STORES = [
  { name: "Trader Joe's", color: "#b84a26" },
  { name: "Whole Foods", color: "#6b7a3a" },
  { name: "Costco", color: "#3a5a7a" },
  { name: "Indian Grocery", color: "#c89534" },
  { name: "Farmers Market", color: "#a8b687" },
  { name: "Online", color: "#8b7e6a" },
];

const storeMeta = (name) => STORES.find(s => s.name === name) || { name, color: "#8b7e6a" };

// ───── Quantity parsing ─────
const FRAC = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 0.333, "⅔": 0.667 };
const parseQty = (qty) => {
  if (!qty) return { count: null, unit: "", raw: qty };
  const s = String(qty).trim();
  if (s.startsWith("✓")) return { count: null, unit: s, raw: s };
  const m = s.match(/^([\d.]+|[½¼¾⅓⅔])\s*(.*)$/);
  if (!m) return { count: null, unit: s, raw: s };
  const n = FRAC[m[1]] ?? parseFloat(m[1]);
  return { count: isNaN(n) ? null : n, unit: m[2] || "", raw: s };
};
const formatNum = (n) => {
  if (n === 0) return "0";
  if (n < 1) return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return String(Math.round(n * 10) / 10);
};

const Grocery = ({ go }) => {
  const {
    groceryTags, setGroceryTag,
    pantryHave, setHave,
    groceryEdits, setGroceryEdit,
    groceryAdditions, addGroceryItem, removeGroceryAddition,
  } = useStore();

  const [view, setView] = React.useState("section");
  const [checked, setChecked] = React.useState({});
  const [tagEditing, setTagEditing] = React.useState(null);
  const [pantryEditing, setPantryEditing] = React.useState(null);
  const [itemEditing, setItemEditing] = React.useState(null); // { originalName, name, qty, custom, sectionName, id? }
  const [addingTo, setAddingTo] = React.useState(null); // section name

  const toggle = (id) => setChecked((p) => ({ ...p, [id]: !p[id] }));

  // ─── Apply edits + additions to produce display sections ───
  const sections = React.useMemo(() => GROCERY.map((section) => {
    const items = section.items
      .filter((it) => !groceryEdits[it.name]?.removed)
      .map((it) => {
        const edit = groceryEdits[it.name];
        return {
          ...it,
          originalName: it.name,
          name: edit?.name || it.name,
          qty: edit?.qty || it.qty,
          renamed: !!edit?.name && edit.name !== it.name,
          quantified: !!edit?.qty && edit.qty !== it.qty,
        };
      });
    const additions = (groceryAdditions[section.section] || []).map((a) => ({
      ...a,
      originalName: a.id,
      custom: true,
    }));
    return { ...section, items: [...items, ...additions] };
  }), [groceryEdits, groceryAdditions]);

  const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0);
  const doneCount = Object.values(checked).filter(Boolean).length;

  // For by-store view
  const itemsByStore = React.useMemo(() => {
    const groups = {};
    sections.forEach((sec) => {
      sec.items.forEach((item) => {
        const tag = groceryTags[item.originalName] || "__untagged__";
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push({ ...item, section: sec.section });
      });
    });
    return groups;
  }, [sections, groceryTags]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Grocery · for the week of May 19"
        title={<>One list, one <em>trip.</em></>}
        sub="Every ingredient across the week, combined into a tidy list. Tag items by store, click any quantity to adjust for what you have, or edit the list to match your taste."
        actions={<>
          <button className="btn btn-ghost btn-sm"><Icon.Print /> Print</button>
          <button className="btn btn-primary btn-sm"><Icon.Cart /> Export list</button>
        </>}
      />

      <div className="between mb-4">
        <div className="row gap-3">
          <div className="seg">
            <button className={view === "section" ? "active" : ""} onClick={() => setView("section")}>By section</button>
            <button className={view === "store" ? "active" : ""} onClick={() => setView("store")}>By store</button>
          </div>
          <span className="muted" style={{ fontSize: 13 }}>
            {view === "section" && "Aisle-style grouping (produce, dairy, pantry…)"}
            {view === "store" && "Grouped by where you'll buy each item"}
          </span>
        </div>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          {STORES.filter(s => Object.values(groceryTags).includes(s.name)).map((s) => (
            <span key={s.name} className="chip" style={{ background: "transparent" }}>
              <span className="dot" style={{ background: s.color }}></span>
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grocery-layout">
        <div>
          {view === "section" ? (
            sections.map((section) => (
              <div key={section.section} className="grocery-section">
                <h3 className="h-2">
                  {section.section}
                  <span className="gh-count">{section.items.length} items</span>
                </h3>
                <div className="muted mb-4" style={{ fontSize: 13 }}>
                  {section.section === "Produce" && "Pick up fresh, ideally on Sunday or Monday morning."}
                  {section.section === "Dairy & Protein" && "Cold chain — split the trip if you can't store immediately."}
                  {section.section === "Pantry & Grains" && "Mostly shelf-stable. Skip what's already in your pantry."}
                  {section.section === "Spices & Oils" && "Quick pantry check — ticked items are likely already on hand."}
                </div>
                {section.items.map((item, i) => {
                  const id = `${section.section}-${item.originalName}-${i}`;
                  return (
                    <GroceryRow
                      key={id} id={id}
                      item={item}
                      checked={!!checked[id]}
                      onToggle={() => toggle(id)}
                      tag={groceryTags[item.originalName]}
                      onEditTag={() => setTagEditing(item.originalName)}
                      have={pantryHave[item.originalName] || 0}
                      onEditPantry={() => setPantryEditing(item.originalName)}
                      onEditItem={() => setItemEditing({ ...item, sectionName: section.section })}
                    />
                  );
                })}
                <button className="add-item-btn" onClick={() => setAddingTo(section.section)}>
                  <Icon.Plus size={14} /> Add an item to {section.section}
                </button>
              </div>
            ))
          ) : (
            <>
              {STORES.map((store) => {
                const items = itemsByStore[store.name];
                if (!items?.length) return null;
                return (
                  <div key={store.name} className="store-section">
                    <div className="store-head">
                      <div className="left">
                        <span className="swatch" style={{ background: store.color }}></span>
                        <h3 className="h-2" style={{ margin: 0 }}>{store.name}</h3>
                      </div>
                      <span className="gh-count">{items.length} items</span>
                    </div>
                    {items.map((item, i) => {
                      const id = `store-${store.name}-${item.originalName}-${i}`;
                      return (
                        <GroceryRow
                          key={id} id={id}
                          item={item}
                          subtitle={item.section}
                          checked={!!checked[id]}
                          onToggle={() => toggle(id)}
                          tag={store.name}
                          onEditTag={() => setTagEditing(item.originalName)}
                          have={pantryHave[item.originalName] || 0}
                          onEditPantry={() => setPantryEditing(item.originalName)}
                          onEditItem={() => setItemEditing({ ...item, sectionName: item.section })}
                        />
                      );
                    })}
                  </div>
                );
              })}
              {itemsByStore["__untagged__"]?.length > 0 && (
                <div className="store-section untagged-section">
                  <div className="store-head">
                    <div className="left">
                      <span className="swatch" style={{ background: "var(--hairline-strong)" }}></span>
                      <h3 className="h-2" style={{ margin: 0 }}>Not yet tagged</h3>
                    </div>
                    <span className="gh-count">{itemsByStore["__untagged__"].length} items</span>
                  </div>
                  <div className="muted mb-4" style={{ fontSize: 13 }}>
                    Tag these so they slot into a store next week.
                  </div>
                  {itemsByStore["__untagged__"].map((item, i) => {
                    const id = `untagged-${item.originalName}-${i}`;
                    return (
                      <GroceryRow
                        key={id} id={id}
                        item={item}
                        subtitle={item.section}
                        checked={!!checked[id]}
                        onToggle={() => toggle(id)}
                        tag={null}
                        onEditTag={() => setTagEditing(item.originalName)}
                        have={pantryHave[item.originalName] || 0}
                        onEditPantry={() => setPantryEditing(item.originalName)}
                        onEditItem={() => setItemEditing({ ...item, sectionName: item.section })}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <aside className="grocery-aside">
          <div className="card">
            <div className="eyebrow mb-2">List summary</div>
            <h3 className="h-2 mt-2">{doneCount} / {totalItems}</h3>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {doneCount === 0 ? "Nothing ticked yet" : doneCount === totalItems ? "All done — go cook!" : "Items collected"}
            </div>
            <div className="macro-bar mt-4" style={{ height: 6 }}>
              <span className="fill" style={{ width: `${(doneCount / totalItems) * 100}%`, background: "var(--olive)" }}></span>
            </div>
          </div>

          <div className="card">
            <div className="eyebrow mb-2">Where you'll shop</div>
            <div className="col gap-2 mt-2">
              {STORES.map((store) => {
                const count = itemsByStore[store.name]?.length || 0;
                if (count === 0) return null;
                return (
                  <div key={store.name} className="row gap-3" style={{ padding: "8px 0", borderBottom: "1px dashed var(--hairline)" }}>
                    <span className="swatch" style={{ width: 10, height: 10, borderRadius: 3, background: store.color, flexShrink: 0 }}></span>
                    <span style={{ flex: 1, fontSize: 13.5 }}>{store.name}</span>
                    <span className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{count}</span>
                  </div>
                );
              })}
              {itemsByStore["__untagged__"]?.length > 0 && (
                <div className="row gap-3" style={{ padding: "8px 0" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--hairline-strong)", flexShrink: 0 }}></span>
                  <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink-mute)" }}>Not yet tagged</span>
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink-mute)" }}>{itemsByStore["__untagged__"].length}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card-flat">
            <div className="eyebrow mb-2">Already at home?</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              Tap any quantity to subtract what's already in your pantry. Edits stick for next week.
            </div>
            <button className="btn btn-ghost btn-sm mt-4" style={{ width: "100%", justifyContent: "center" }}>
              <Icon.Sparkle /> Set up my pantry
            </button>
          </div>
        </aside>
      </div>

      <TagEditor
        itemName={tagEditing}
        currentTag={tagEditing ? groceryTags[tagEditing] : null}
        onClose={() => setTagEditing(null)}
        onSet={(t) => { setGroceryTag(tagEditing, t); setTagEditing(null); }}
      />

      <PantryEditor
        itemName={pantryEditing}
        item={pantryEditing ? findItem(sections, pantryEditing) : null}
        currentHave={pantryEditing ? (pantryHave[pantryEditing] || 0) : 0}
        onClose={() => setPantryEditing(null)}
        onSet={(n) => { setHave(pantryEditing, n); setPantryEditing(null); }}
      />

      <ItemEditor
        target={itemEditing}
        onClose={() => setItemEditing(null)}
        onSave={(name, qty) => {
          if (itemEditing.custom) {
            // For a custom (manually-added) item, remove + re-add with new values
            removeGroceryAddition(itemEditing.sectionName, itemEditing.id);
            addGroceryItem(itemEditing.sectionName, name, qty);
          } else {
            setGroceryEdit(itemEditing.originalName, { name, qty });
          }
          setItemEditing(null);
        }}
        onRemove={() => {
          if (itemEditing.custom) {
            removeGroceryAddition(itemEditing.sectionName, itemEditing.id);
          } else {
            setGroceryEdit(itemEditing.originalName, { removed: true });
          }
          setItemEditing(null);
        }}
        onRestore={() => {
          setGroceryEdit(itemEditing.originalName, null);
          setItemEditing(null);
        }}
      />

      <AddItemModal
        section={addingTo}
        onClose={() => setAddingTo(null)}
        onAdd={(name, qty) => { addGroceryItem(addingTo, name, qty); setAddingTo(null); }}
      />
    </div>
  );
};

const findItem = (sections, originalName) => {
  for (const sec of sections) {
    const it = sec.items.find((i) => i.originalName === originalName);
    if (it) return it;
  }
  return null;
};

// ───── Grocery row ─────
const GroceryRow = ({ item, checked, onToggle, tag, onEditTag, subtitle, have = 0, onEditPantry, onEditItem }) => {
  const meta = tag ? storeMeta(tag) : null;
  const parsed = parseQty(item.qty);
  const isCheckItem = String(item.qty).startsWith("✓");
  const buy = parsed.count != null ? Math.max(0, parsed.count - have) : null;
  const skip = parsed.count != null && have >= parsed.count;
  const adjusted = have > 0 && parsed.count != null;

  return (
    <div className={`grocery-row ${checked ? "done" : ""} ${skip ? "skip" : ""}`}>
      <button className={`check ${checked ? "on" : ""}`} onClick={onToggle}>
        {checked && <Icon.Check size={12} />}
      </button>
      <div>
        <div className={`gname ${item.custom ? "custom" : ""}`}>
          {item.name}
          {item.renamed && <span className="renamed-note">was {item.originalName.toLowerCase()}</span>}
          {item.custom && <span className="renamed-note">added by you</span>}
        </div>
        {subtitle && <div className="mono muted" style={{ fontSize: 10, letterSpacing: "0.08em", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {tag ? (
        <button className="tag-pill" onClick={onEditTag} title="Change store">
          <span className="swatch" style={{ background: meta.color }}></span>
          {tag}
        </button>
      ) : (
        <button className="tag-pill untagged" onClick={onEditTag} title="Tag a store">
          <Icon.Plus size={10} /> Tag store
        </button>
      )}
      {isCheckItem ? (
        <span className="gqty">{item.qty}</span>
      ) : (
        <button className="gqty-btn" onClick={onEditPantry} title="Adjust for what you already have">
          {skip ? (
            <span className="qty-skip"><Icon.Check size={12} /> Have it</span>
          ) : adjusted ? (
            <>
              <span>
                <span className="qty-strike">{formatNum(parsed.count)}</span>
                <span className="qty-adjusted">{formatNum(buy)}{parsed.unit ? " " + parsed.unit : ""}</span>
              </span>
              <span className="qty-note">had {formatNum(have)} at home</span>
            </>
          ) : (
            <span className="qty-main">{item.qty}</span>
          )}
        </button>
      )}
      <button className="row-menu-btn" onClick={onEditItem} title="Edit or remove">
        <Icon.Dots />
      </button>
    </div>
  );
};

// ───── Tag editor modal ─────
const TagEditor = ({ itemName, currentTag, onClose, onSet }) => {
  const [custom, setCustom] = React.useState("");
  if (!itemName) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><Icon.X /></button>
        <div className="eyebrow mb-2">Tag store</div>
        <h3 className="h-2 mb-2">{itemName}</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          Where will you buy this? We'll remember and apply it the next time this item shows up on your list.
        </p>

        <div className="store-pick-grid mt-4">
          {STORES.map((s) => (
            <button
              key={s.name}
              className={`store-pick ${currentTag === s.name ? "selected" : ""}`}
              onClick={() => onSet(s.name)}>
              <span className="swatch" style={{ background: s.color }}></span>
              <span className="pick-name">{s.name}</span>
              {currentTag === s.name && <Icon.Check size={14} />}
            </button>
          ))}
        </div>

        <div className="divider"><span>or custom</span></div>

        <div className="row gap-2">
          <input
            className="input"
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. Patel Brothers"
            onKeyDown={(e) => e.key === "Enter" && custom.trim() && onSet(custom.trim())}
          />
          <button className="btn btn-primary" disabled={!custom.trim()}
            style={!custom.trim() ? { opacity: 0.4, cursor: "not-allowed" } : {}}
            onClick={() => custom.trim() && onSet(custom.trim())}>Add</button>
        </div>

        {currentTag && (
          <div className="mt-6" style={{ paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
            <button className="text-link" onClick={() => onSet(null)}>
              Remove tag — leave untagged
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ───── Pantry editor modal ─────
const PantryEditor = ({ itemName, item, currentHave, onClose, onSet }) => {
  const [have, setLocalHave] = React.useState(currentHave);
  React.useEffect(() => { setLocalHave(currentHave); }, [itemName, currentHave]);

  if (!itemName || !item) return null;
  const parsed = parseQty(item.qty);
  const count = parsed.count ?? 1;
  const buy = Math.max(0, count - have);
  const skip = have >= count;
  const stepSize = count < 2 ? 0.25 : 1;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <button className="modal-close" onClick={onClose}><Icon.X /></button>
        <div className="eyebrow mb-2">Check your pantry</div>
        <h3 className="h-2 mb-2">{item.name}</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          The plan calls for <strong style={{ color: "var(--ink)" }}>{item.qty}</strong>.
          How much do you already have at home?
        </p>

        <div className="between mt-6" style={{ alignItems: "flex-end" }}>
          <div>
            <div className="field-label" style={{ marginBottom: 0 }}>I already have</div>
            <div className="field-hint" style={{ marginTop: 4 }}>
              {parsed.unit ? `In ${parsed.unit}, roughly` : "How many"}
            </div>
          </div>
          <div className="stepper">
            <button onClick={() => setLocalHave(Math.max(0, +(have - stepSize).toFixed(2)))}>−</button>
            <span className="val">{formatNum(have)}</span>
            <button onClick={() => setLocalHave(Math.min(count, +(have + stepSize).toFixed(2)))}>+</button>
          </div>
        </div>

        <div className="slider-row mt-4">
          <input
            className="slider" type="range"
            min="0" max={count}
            step={stepSize}
            value={have}
            onChange={(e) => setLocalHave(Number(e.target.value))}
          />
        </div>

        <div className={`pantry-result ${skip ? "skip" : ""}`}>
          <div>
            <div className="label">Add to your list</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {skip ? "Skip this trip" : `${formatNum(buy)} ${parsed.unit || ""} to buy`}
            </div>
          </div>
          <div className="value">
            {skip ? <span className="row gap-2"><Icon.Check /> Have it</span> : `${formatNum(buy)}${parsed.unit ? " " + parsed.unit : ""}`}
          </div>
        </div>

        <div className="row gap-2 mt-6">
          {currentHave > 0 && (
            <button className="btn btn-ghost" onClick={() => onSet(0)}>Reset</button>
          )}
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => onSet(have)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ───── Item editor modal (rename / change qty / remove) ─────
const ItemEditor = ({ target, onClose, onSave, onRemove, onRestore }) => {
  const [name, setName] = React.useState("");
  const [qty, setQty] = React.useState("");
  React.useEffect(() => {
    if (target) { setName(target.name); setQty(target.qty); }
  }, [target]);
  if (!target) return null;

  const canSave = name.trim() && qty.trim();
  const showRestore = target.renamed || target.quantified;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <button className="modal-close" onClick={onClose}><Icon.X /></button>
        <div className="eyebrow mb-2">{target.custom ? "Edit added item" : "Edit grocery item"}</div>
        <h3 className="h-2 mb-2">
          {target.custom ? "Your addition" : (target.renamed ? <>was <span className="muted">{target.originalName}</span></> : target.originalName)}
        </h3>
        <p className="muted" style={{ fontSize: 13 }}>
          Don't like yellow onions? Want to swap a brand? Rename, requantify, or remove this item — we'll remember next week.
        </p>

        <div className="col gap-4 mt-6">
          <div>
            <label className="field-label">Item name</label>
            <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Red onion" autoFocus />
          </div>
          <div>
            <label className="field-label">Quantity</label>
            <input className="input" type="text" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 8, 1 lb, 1 bunch" />
            <div className="field-hint">Free-form text — numbers + a unit if it makes sense.</div>
          </div>
        </div>

        <div className="row gap-2 mt-6">
          <button className="btn btn-ghost" style={{ color: "var(--paprika)", borderColor: "var(--paprika-soft)" }} onClick={onRemove}>
            <Icon.Trash /> Remove
          </button>
          {showRestore && (
            <button className="btn btn-ghost" onClick={onRestore}>Restore original</button>
          )}
          <div style={{ flex: 1 }}></div>
          <button className="btn btn-primary"
            disabled={!canSave}
            style={!canSave ? { opacity: 0.4, cursor: "not-allowed" } : {}}
            onClick={() => canSave && onSave(name.trim(), qty.trim())}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ───── Add new item modal ─────
const AddItemModal = ({ section, onClose, onAdd }) => {
  const [name, setName] = React.useState("");
  const [qty, setQty] = React.useState("");
  React.useEffect(() => { if (!section) { setName(""); setQty(""); } }, [section]);
  if (!section) return null;

  const canAdd = name.trim() && qty.trim();
  const submit = () => canAdd && onAdd(name.trim(), qty.trim());

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <button className="modal-close" onClick={onClose}><Icon.X /></button>
        <div className="eyebrow mb-2">Add to {section}</div>
        <h3 className="h-2 mb-2">What are you adding?</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          Something you want to grab that's not in the auto-generated list — coffee, snacks, a household staple.
        </p>

        <div className="col gap-4 mt-6">
          <div>
            <label className="field-label">Item name</label>
            <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Avocado" autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          <div>
            <label className="field-label">Quantity</label>
            <input className="input" type="text" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 4, 1 lb, 1 bunch" onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
        </div>

        <div className="row gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <div style={{ flex: 1 }}></div>
          <button className="btn btn-primary"
            disabled={!canAdd}
            style={!canAdd ? { opacity: 0.4, cursor: "not-allowed" } : {}}
            onClick={submit}>
            <Icon.Plus /> Add to list
          </button>
        </div>
      </div>
    </div>
  );
};

window.Grocery = Grocery;
