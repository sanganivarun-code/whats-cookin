// Main app — routes between screens using a single state value.

const { useState: useStateApp, useEffect: useEffectApp } = React;

const Shell = () => {
  const [route, setRoute] = useStateApp("landing");

  useEffectApp(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route]);

  const go = (r) => setRoute(r);

  return (
    <div className="app" data-screen-label={routeLabel(route)}>
      <TopNav route={route} go={go} />
      {route === "landing" && <Landing go={go} />}
      {route === "onboarding" && <Onboarding go={go} />}
      {route === "loading" && <Loading go={go} nextRoute="today" />}
      {route === "today" && <Today go={go} />}
      {route === "dashboard" && <Dashboard go={go} />}
      {route === "recipe" && <Recipe go={go} />}
      {route === "grocery" && <Grocery go={go} />}
      {route === "nutrition" && <Nutrition go={go} />}
      <AuthModal />
      <MealEditSheet go={go} />
    </div>
  );
};

const App = () => (
  <StoreProvider>
    <Shell />
  </StoreProvider>
);

const routeLabel = (r) => ({
  landing: "01 Landing",
  onboarding: "02 Onboarding",
  today: "03 Today",
  dashboard: "04 Weekly plan",
  recipe: "05 Recipe detail",
  grocery: "06 Grocery list",
  nutrition: "07 Nutrition summary",
}[r] || r);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
