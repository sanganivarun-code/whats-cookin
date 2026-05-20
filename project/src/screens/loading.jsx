// In-app loading screen — shown after onboarding while we "cook up" the plan.

const COOKING_QUOTES = [
  "Whisking together a plan…",
  "Letting it simmer…",
  "Plating up your week…",
  "Marinating your preferences…",
  "Folding in the flavors…",
  "Putting the kettle on…",
  "Calibrating the spice rack…",
  "Stirring in your goals…",
];

const Loading = ({ go, nextRoute = "today", delay = 3000 }) => {
  const [quoteIdx, setQuoteIdx] = React.useState(() =>
    Math.floor(Math.random() * COOKING_QUOTES.length));
  const [iconIdx, setIconIdx] = React.useState(0);

  React.useEffect(() => {
    const ti = setInterval(() => setIconIdx((i) => (i + 1) % 4), 700);
    const tq = setInterval(() => setQuoteIdx((i) => (i + 1) % COOKING_QUOTES.length), 1800);
    const done = setTimeout(() => go(nextRoute), delay);
    return () => { clearInterval(ti); clearInterval(tq); clearTimeout(done); };
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-stage">
        <div className="halo"></div>
        <div className="spinner-ring"></div>
        <div className="loading-brand-circle">
          <div className="loading-icon-stack">
            <span className={`li ${iconIdx === 0 ? "on" : ""}`}><ChefHat /></span>
            <span className={`li ${iconIdx === 1 ? "on" : ""}`}><Pot /></span>
            <span className={`li ${iconIdx === 2 ? "on" : ""}`}><SteamBowl /></span>
            <span className={`li ${iconIdx === 3 ? "on" : ""}`}><Loaf /></span>
          </div>
        </div>
      </div>

      <h1 className="h-display loading-title">
        What's <em>cookin'?</em>
      </h1>

      <div className="loading-quote-wrap">
        <p className="loading-quote" key={quoteIdx}>{COOKING_QUOTES[quoteIdx]}</p>
      </div>

      <div className="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  );
};

// Inline SVG icons for the loader — kept self-contained so this screen is breathable.
const ChefHat = () => (
  <svg viewBox="-60 -60 120 120" width="100%" height="100%" fill="none"
    stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="0" cy="-15" rx="42" ry="34" />
    <rect x="-38" y="18" width="76" height="28" rx="5" />
    <line x1="-15" y1="-25" x2="-15" y2="5" />
    <line x1="0" y1="-30" x2="0" y2="5" />
    <line x1="15" y1="-25" x2="15" y2="5" />
  </svg>
);
const Pot = () => (
  <svg viewBox="-60 -60 120 120" width="100%" height="100%" fill="none"
    stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="-55" y1="-22" x2="55" y2="-22" />
    <path d="M-42 -22 L-42 30 Q-42 48 -24 48 L24 48 Q42 48 42 30 L42 -22" />
    <line x1="-62" y1="-12" x2="-47" y2="-12" />
    <line x1="47" y1="-12" x2="62" y2="-12" />
  </svg>
);
const SteamBowl = () => (
  <svg viewBox="-60 -60 120 120" width="100%" height="100%" fill="none"
    stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-46 5 Q-46 45 0 45 Q46 45 46 5 Z" />
    <line x1="-46" y1="5" x2="46" y2="5" />
    <path d="M-20 -38 Q-10 -25 -20 -12" strokeWidth="5" />
    <path d="M3 -50 Q13 -36 3 -22" strokeWidth="5" />
    <path d="M24 -40 Q34 -26 24 -12" strokeWidth="5" />
  </svg>
);
const Loaf = () => (
  <svg viewBox="-60 -60 120 120" width="100%" height="100%" fill="none"
    stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-48 22 Q-48 -22 0 -28 Q48 -22 48 22 Z" />
    <line x1="-28" y1="-10" x2="-15" y2="-22" strokeWidth="5" />
    <line x1="-10" y1="-15" x2="3" y2="-26" strokeWidth="5" />
    <line x1="8" y1="-12" x2="20" y2="-22" strokeWidth="5" />
  </svg>
);

window.Loading = Loading;
