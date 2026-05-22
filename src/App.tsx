import { useState, useEffect } from 'react'
import type { AppRoute } from './types/store'
import { StoreProvider } from './context/StoreContext'
import { TopNav } from './components/TopNav'
import { AuthModal } from './components/AuthModal'
import { MealEditSheet } from './components/MealEditSheet'
import { Landing } from './screens/Landing'
import { Onboarding } from './screens/Onboarding'
import { Loading } from './screens/Loading'
import { Today } from './screens/Today'
import { Dashboard } from './screens/Dashboard'
import { Recipe } from './screens/Recipe'
import { Grocery } from './screens/Grocery'
import { Nutrition } from './screens/Nutrition'
import { Favorites } from './screens/Favorites'
import { routeLabel } from './utils/mealPlan'

function Shell() {
  const [route, setRoute] = useState<AppRoute>('landing')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [route])

  const go = (r: AppRoute) => setRoute(r)

  return (
    <div className="app" data-screen-label={routeLabel(route)}>
      <TopNav route={route} go={go} />
      {route === 'landing'    && <Landing    go={go} />}
      {route === 'onboarding' && <Onboarding go={go} />}
      {route === 'loading'    && <Loading    go={go} />}
      {route === 'today'      && <Today      go={go} />}
      {route === 'dashboard'  && <Dashboard  go={go} />}
      {route === 'recipe'     && <Recipe     go={go} />}
      {route === 'grocery'    && <Grocery    go={go} />}
      {route === 'nutrition'  && <Nutrition  go={go} />}
      {route === 'favorites'  && <Favorites  go={go} />}
      <AuthModal />
      <MealEditSheet go={go} />
    </div>
  )
}

function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

export default App
