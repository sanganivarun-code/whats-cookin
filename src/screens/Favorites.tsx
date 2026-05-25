import type { AppRoute } from '../types/store'
import type { MealEntity } from '../types/meal'
import { useStore } from '../context/StoreContext'
import { Icon, FoodGlyph } from '../components/Icons'
import { groupByCuisine, sortCuisineGroups } from '../utils/favorites'

interface FavoritesProps {
  go: (r: AppRoute) => void
}

export function Favorites({ go }: FavoritesProps) {
  const { favorites, toggleFavorite, getMealEntity, signedIn, setAuthOpen, setRecipeTarget } = useStore()

  const resolved: MealEntity[] = []
  const tombstoneIds: string[] = []

  for (const id of favorites) {
    const entity = getMealEntity(id)
    if (!entity) { tombstoneIds.push(id); continue }
    resolved.push(entity)
  }

  const sortedGroups = sortCuisineGroups(groupByCuisine(resolved))
  const isEmpty = sortedGroups.length === 0 && tombstoneIds.length === 0

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

      {isEmpty ? (
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
        <div>
          {sortedGroups.map(([cuisine, entities]) => (
            <div key={cuisine} className="mb-6">
              <div className="eyebrow mb-3">{cuisine}</div>
              <div className="fav-grid">
                {entities.map(entity => (
                  <div key={entity.id} className="meal-card" style={{ position: 'relative', cursor: 'pointer' }}
                    onClick={() => { setRecipeTarget(entity.id); go('recipe') }}>
                    <div className="meal-actions">
                      <button
                        className="heart-btn on"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(entity.id) }}
                        title="Remove from favorites">
                        <Icon.Heart filled size={12} />
                      </button>
                    </div>
                    <FoodGlyph kind={entity.glyph} tone={entity.tone} size="sm" />
                    <span className="meal-name" style={{ marginTop: 8 }}>{entity.name}</span>
                    <span className="meal-kcal">{entity.nutrition.kcal} kcal · {entity.nutrition.p}g P</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {tombstoneIds.length > 0 && (
            <div className="mb-6">
              <div className="eyebrow mb-3">Unavailable</div>
              <div className="fav-grid">
                {tombstoneIds.map(id => (
                  <div key={id} className="meal-card" style={{ position: 'relative', opacity: 0.5 }}>
                    <div className="meal-actions">
                      <button
                        className="heart-btn on"
                        onClick={() => toggleFavorite(id)}
                        title="Remove from favorites">
                        <Icon.Heart filled size={12} />
                      </button>
                    </div>
                    <FoodGlyph kind="Bowl" tone="ink" size="sm" />
                    <span className="meal-name" style={{ marginTop: 8 }}>Meal unavailable</span>
                    <span className="meal-kcal">No longer in your plan</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
