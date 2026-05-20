import { useState } from 'react'
import type React from 'react'
import type { AppRoute } from '../types/store'
import { useStore } from '../context/StoreContext'
import { Icon } from './Icons'

interface TopNavProps {
  route: AppRoute
  go: (r: AppRoute) => void
}

const NAV_LINKS: { id: AppRoute; label: string; icon: React.ReactNode }[] = [
  { id: 'today',     label: 'Today',     icon: <Icon.Clock     size={20} /> },
  { id: 'dashboard', label: 'This week', icon: <Icon.Bookmark  size={20} /> },
  { id: 'nutrition', label: 'Nutrition', icon: <Icon.Flame     size={20} /> },
  { id: 'grocery',   label: 'Grocery',   icon: <Icon.Cart      size={20} /> },
]

export function TopNav({ route, go }: TopNavProps) {
  const { signedIn, authLoading, signOut, user, setAuthOpen, favorites } = useStore()
  const [userMenu, setUserMenu] = useState(false)

  const showOnApp = route !== 'landing' && route !== 'onboarding'

  return (
    <>
    <header className="topnav">
      <div className="topnav-inner">
        <button className="brand" onClick={() => go('landing')}>
          <span className="mark">W</span>
          <span>What's <em>Cookin'?</em></span>
        </button>

        {showOnApp && (
          <nav className="nav-links">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                className={`nav-link${route === l.id ? ' active' : ''}`}
                onClick={() => go(l.id)}>
                {l.label}
              </button>
            ))}
          </nav>
        )}

        <div className="nav-spacer" />

        {route === 'landing' && (
          <>
            {!authLoading && !signedIn && (
              <button className="nav-link" onClick={() => setAuthOpen(true)}>Sign in</button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => go('onboarding')}>
              Get started <Icon.Arrow size={14} />
            </button>
          </>
        )}

        {showOnApp && !authLoading && !signedIn && (
          <button className="btn btn-ghost btn-sm" onClick={() => setAuthOpen(true)}>
            <Icon.Lock /> Sign in to save
          </button>
        )}

        {showOnApp && !authLoading && signedIn && (
          <div style={{ position: 'relative' }}>
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
                  <div className="user-menu-sep" />
                  <button className="user-menu-item" onClick={() => { setUserMenu(false); signOut() }}>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>

    {showOnApp && (
      <nav className="bottom-nav">
        {NAV_LINKS.map((l) => (
          <button
            key={l.id}
            className={`bottom-nav-btn${route === l.id ? ' active' : ''}`}
            onClick={() => go(l.id)}>
            {l.icon}
            <span>{l.label}</span>
          </button>
        ))}
      </nav>
    )}
    </>
  )
}
