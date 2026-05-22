import type { AppRoute } from '../types/store'
import { useStore } from '../context/StoreContext'
import { Icon, FoodGlyph } from '../components/Icons'

interface FavoritesProps {
  go: (r: AppRoute) => void
}

export function Favorites({ go }: FavoritesProps) {
  const { favorites, toggleFavorite, getMeal, signedIn, setAuthOpen } = useStore()

  const favMeals = [...favorites]
    .map(id => getMeal(id))
    .filter((m): m is NonNullable<ReturnType<typeof getMeal>> => m !== undefined)

  return (
    <div className="page">
      {!signedIn && (
        <div className="info-card">
          Sign in to save favorites across sessions.{' '}
          <button className="text-link" onClick={() => setAuthOpen(true)}>Sign in</button>
        </div>
      )}

      <div className="page-header mb-6">
        <div>
          <div className="eyebrow mb-2">Your collection</div>
          <h1 className="h-1">Your <em>favorites</em></h1>
          <p className="lead" style={{ marginTop: 8 }}>Meals you've hearted across your plans.</p>
        </div>
      </div>

      {favMeals.length === 0 ? (
        <div style={{ paddingTop: 48, textAlign: 'center' }}>
          <div style={{ color: 'var(--hairline-strong)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <Icon.Heart size={36} />
          </div>
          <p className="muted" style={{ fontSize: 15, marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
            {!signedIn
              ? 'No favorites yet. Heart meals from the sample plan to see them here.'
              : 'No saved favorites yet. Heart meals from your plan to save them here.'}
          </p>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => go(signedIn ? 'onboarding' : 'dashboard')}>
            {signedIn ? 'Generate a plan' : 'View sample plan'} <Icon.Arrow size={12} />
          </button>
        </div>
      ) : (
        <div className="fav-grid">
          {favMeals.map(meal => (
            <div key={meal.id} className="meal-card" style={{ position: 'relative' }}>
              <div className="meal-actions">
                <button
                  className="heart-btn on"
                  onClick={() => toggleFavorite(meal.id)}
                  title="Remove from favorites">
                  <Icon.Heart filled size={12} />
                </button>
              </div>
              <FoodGlyph kind={meal.glyph} tone={meal.tone} size="sm" />
              <span className="meal-name" style={{ marginTop: 8 }}>{meal.name}</span>
              <span className="meal-kcal">{meal.kcal} kcal · {meal.p}g P</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
