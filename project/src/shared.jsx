// Shared chrome: top nav + page wrapper.

const TopNav = ({ route, go }) => {
  const { signedIn, signOut, user, setAuthOpen, favorites } = useStore();
  const [userMenu, setUserMenu] = React.useState(false);

  const links = [
    { id: "today", label: "Today" },
    { id: "dashboard", label: "This week" },
    { id: "nutrition", label: "Nutrition" },
    { id: "grocery", label: "Grocery" },
  ];
  const showOnApp = route !== "landing" && route !== "onboarding";

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <button className="brand" onClick={() => go("landing")}>
          <span className="mark">W</span>
          <span>What's <em>Cookin'?</em></span>
        </button>
        {showOnApp && (
          <nav className="nav-links">
            {links.map((l) => (
              <button
                key={l.id}
                className={`nav-link ${route === l.id ? "active" : ""}`}
                onClick={() => go(l.id)}>
                {l.label}
              </button>
            ))}
          </nav>
        )}
        <div className="nav-spacer"></div>

        {route === "landing" && (
          <>
            {!signedIn && (
              <button className="nav-link" onClick={() => setAuthOpen(true)}>Sign in</button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => go("onboarding")}>
              Get started <Icon.Arrow size={14} />
            </button>
          </>
        )}

        {showOnApp && !signedIn && (
          <button className="btn btn-ghost btn-sm" onClick={() => setAuthOpen(true)}>
            <Icon.Lock /> Sign in to save
          </button>
        )}

        {showOnApp && signedIn && (
          <div style={{ position: "relative" }}>
            <button className="nav-user" onClick={() => setUserMenu((v) => !v)}>
              <span>{user.name}</span>
              <span className="avatar">{user.initial}</span>
            </button>
            {userMenu && (
              <>
                <div className="menu-backdrop" onClick={() => setUserMenu(false)} />
                <div className="user-menu">
                  <div className="user-menu-head">
                    <div className="serif" style={{ fontWeight: 500, fontSize: 15 }}>{user.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{user.email}</div>
                  </div>
                  <button className="user-menu-item">
                    <Icon.Bookmark size={14} /> My saved plans
                    <span className="mono muted ml-auto" style={{ fontSize: 11 }}>3</span>
                  </button>
                  <button className="user-menu-item">
                    <Icon.Heart size={14} /> Favorite recipes
                    <span className="mono muted ml-auto" style={{ fontSize: 11 }}>{favorites.size}</span>
                  </button>
                  <button className="user-menu-item">
                    <Icon.Sparkle size={14} /> Preferences
                  </button>
                  <div className="user-menu-sep"></div>
                  <button className="user-menu-item" onClick={() => { setUserMenu(false); signOut(); }}>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

const PageHeader = ({ eyebrow, title, sub, actions }) => (
  <div className="between mb-6" style={{ alignItems: "flex-end", gap: 24 }}>
    <div>
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h1 className="h-1">{title}</h1>
      {sub && <p className="lead mt-2" style={{ marginTop: 8 }}>{sub}</p>}
    </div>
    {actions && <div className="row gap-2">{actions}</div>}
  </div>
);

window.TopNav = TopNav;
window.PageHeader = PageHeader;
