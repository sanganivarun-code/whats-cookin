// Shared app state — sign-in, favorites, manual meal overrides.

const { createContext, useContext, useState } = React;

const StoreContext = createContext(null);

const StoreProvider = ({ children }) => {
  const [signedIn, setSignedIn] = useState(false);
  const [user] = useState({
    name: "Aanya Sharma",
    initial: "A",
    email: "aanya@cookin.test",
  });
  const [favorites, setFavorites] = useState(new Set(["paneer_bhurji", "khichdi"]));
  // overrides: { "<dayIndex>_<slot>": { kind: 'eating-out'|'self-cook'|'custom'|'removed', name?: string } }
  const [overrides, setOverrides] = useState({});
  const [authOpen, setAuthOpen] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  // Grocery item tags — keyed by item NAME so they persist across weeks.
  // Seed a few defaults so the feature is discoverable.
  const [groceryTags, setGroceryTags] = useState({
    "Paneer": "Indian Grocery",
    "Yellow moong dal": "Indian Grocery",
    "Chickpea flour (besan)": "Indian Grocery",
    "Sorghum (jowar) flour": "Indian Grocery",
    "Idli rava": "Indian Grocery",
    "Ghee": "Indian Grocery",
    "Tofu, firm": "Trader Joe's",
    "Greek yogurt": "Trader Joe's",
    "Plain yogurt": "Trader Joe's",
    "Brown rice": "Costco",
    "Quinoa": "Costco",
    "Milk": "Costco",
    "Spinach": "Farmers Market",
    "Cilantro": "Farmers Market",
    "Mint": "Farmers Market",
    "Banana": "Farmers Market",
    "Apple": "Farmers Market",
    "Lemon": "Farmers Market",
  });
  const setGroceryTag = (name, tag) => setGroceryTags((prev) => {
    const next = { ...prev };
    if (tag) next[name] = tag;
    else delete next[name];
    return next;
  });

  // Pantry adjustments — keyed by item name. How much the user already has at home.
  const [pantryHave, setPantryHave] = useState({});
  const setHave = (name, n) => setPantryHave((prev) => {
    const next = { ...prev };
    if (!n) delete next[name];
    else next[name] = n;
    return next;
  });

  // Grocery edits — rename / requantify / remove items from the generated list.
  // Keyed by the ORIGINAL item name so tags + pantry state survive a rename.
  const [groceryEdits, setGroceryEdits] = useState({});
  const setGroceryEdit = (originalName, edit) => setGroceryEdits((prev) => {
    const next = { ...prev };
    if (!edit) delete next[originalName];
    else next[originalName] = { ...next[originalName], ...edit };
    return next;
  });

  // Items the user added manually — grouped by section.
  const [groceryAdditions, setGroceryAdditions] = useState({});
  const addGroceryItem = (section, name, qty) => setGroceryAdditions((prev) => ({
    ...prev,
    [section]: [...(prev[section] || []), { id: `add-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, qty, custom: true }],
  }));
  const removeGroceryAddition = (section, id) => setGroceryAdditions((prev) => ({
    ...prev,
    [section]: (prev[section] || []).filter((x) => x.id !== id),
  }));
  // Editing UI state
  const [editTarget, setEditTarget] = useState(null); // { dayIndex, slot, action? }

  const toggleFavorite = (id) => setFavorites((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const setOverride = (dayIndex, slot, value) => {
    const key = `${dayIndex}_${slot}`;
    setOverrides((prev) => {
      const next = { ...prev };
      if (value == null) delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const getOverride = (dayIndex, slot) => overrides[`${dayIndex}_${slot}`] || null;

  const signIn = () => {
    setSignedIn(true);
    setAuthOpen(false);
    setPlanSaved(true);
  };
  const signOut = () => {
    setSignedIn(false);
    setPlanSaved(false);
  };

  return (
    <StoreContext.Provider value={{
      signedIn, signIn, signOut, user,
      favorites, toggleFavorite,
      overrides, setOverride, getOverride,
      authOpen, setAuthOpen,
      planSaved, setPlanSaved,
      editTarget, setEditTarget,
      groceryTags, setGroceryTag,
      pantryHave, setHave,
      groceryEdits, setGroceryEdit,
      groceryAdditions, addGroceryItem, removeGroceryAddition,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

const useStore = () => useContext(StoreContext);

window.StoreProvider = StoreProvider;
window.useStore = useStore;
