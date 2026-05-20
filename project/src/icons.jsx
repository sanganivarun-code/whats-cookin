// Simple geometric food glyphs — circles, arcs, lines only.
// Each is a React component returning an SVG.

const G = {
  // Bowl with steam (curry / dal)
  Bowl: () => (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 17 Q5 25 16 25 Q27 25 27 17 Z" fill="currentColor" fillOpacity="0.15" />
      <line x1="5" y1="17" x2="27" y2="17" />
      <path d="M12 7 Q14 9 12 11 Q10 13 12 14" strokeWidth="1.2" />
      <path d="M18 7 Q20 9 18 11 Q16 13 18 14" strokeWidth="1.2" />
    </svg>
  ),
  // Roti / chapati — flat disc
  Roti: () => (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="16" cy="17" rx="11" ry="3" fill="currentColor" fillOpacity="0.15" />
      <ellipse cx="16" cy="15" rx="11" ry="3" />
      <circle cx="12" cy="14" r="0.6" fill="currentColor" />
      <circle cx="18" cy="15" r="0.6" fill="currentColor" />
      <circle cx="15" cy="16" r="0.6" fill="currentColor" />
    </svg>
  ),
  // Glass / lassi / drink
  Glass: () => (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 8 L11 25 Q11 27 16 27 Q21 27 21 25 L22 8 Z" fill="currentColor" fillOpacity="0.15" />
      <line x1="10.5" y1="13" x2="21.5" y2="13" />
    </svg>
  ),
  // Leaf — sprouts / herbs / veg
  Leaf: () => (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 24 Q8 8 24 8 Q24 24 8 24 Z" fill="currentColor" fillOpacity="0.15" />
      <line x1="8" y1="24" x2="20" y2="12" />
    </svg>
  ),
  // Stack — paratha / sandwich
  Stack: () => (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <ellipse cx="16" cy="11" rx="10" ry="2.5" fill="currentColor" fillOpacity="0.15" />
      <ellipse cx="16" cy="16" rx="10" ry="2.5" />
      <ellipse cx="16" cy="21" rx="10" ry="2.5" fill="currentColor" fillOpacity="0.15" />
    </svg>
  ),
  // Egg / dome (idli, dumpling)
  Dome: () => (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 22 Q6 10 16 10 Q26 10 26 22 Z" fill="currentColor" fillOpacity="0.15" />
      <line x1="6" y1="22" x2="26" y2="22" />
    </svg>
  ),
  // Pot / kadhai
  Pot: () => (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M7 12 L7 22 Q7 25 16 25 Q25 25 25 22 L25 12 Z" fill="currentColor" fillOpacity="0.15" />
      <line x1="5" y1="12" x2="27" y2="12" />
      <line x1="3" y1="14" x2="6" y2="14" />
      <line x1="26" y1="14" x2="29" y2="14" />
    </svg>
  ),
  // Bowl of rice — bowl with grains hint
  Rice: () => (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 16 Q5 25 16 25 Q27 25 27 16 Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M5 16 Q10 12 16 13 Q22 12 27 16" />
      <circle cx="10" cy="14" r="0.6" fill="currentColor" />
      <circle cx="14" cy="13" r="0.6" fill="currentColor" />
      <circle cx="18" cy="14" r="0.6" fill="currentColor" />
      <circle cx="22" cy="14" r="0.6" fill="currentColor" />
    </svg>
  ),
  // Square / paneer cube
  Cube: () => (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <rect x="8" y="10" width="16" height="14" rx="2" fill="currentColor" fillOpacity="0.15" />
      <line x1="8" y1="14" x2="24" y2="14" />
      <line x1="14" y1="10" x2="14" y2="24" />
    </svg>
  ),
};

const FoodGlyph = ({ kind, tone = "paprika", size = "md" }) => {
  const Comp = G[kind] || G.Bowl;
  const toneColor = {
    paprika: "var(--paprika)",
    saffron: "var(--saffron)",
    olive: "var(--olive)",
    ink: "var(--ink)",
  }[tone];
  const bg = {
    paprika: "var(--paprika-soft)",
    saffron: "var(--saffron-soft)",
    olive: "var(--olive-soft)",
    ink: "var(--bg-warm)",
  }[tone];
  return (
    <div className={`glyph ${size === "lg" ? "lg" : size === "sm" ? "sm" : ""}`}
      style={{ background: bg, color: toneColor }}>
      <Comp />
    </div>
  );
};

// Generic line icons
const Icon = {
  Arrow: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  ArrowLeft: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  Check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5 9-11" />
    </svg>
  ),
  Plus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Swap: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4L4 7l3 3M4 7h13a4 4 0 014 4M17 20l3-3-3-3M20 17H7a4 4 0 01-4-4" />
    </svg>
  ),
  Clock: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Flame: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />
    </svg>
  ),
  Cart: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l2 12h12l2-8H6" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  ),
  Bookmark: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M6 4h12v17l-6-4-6 4V4z" />
    </svg>
  ),
  Print: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M7 9V4h10v5M7 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v6H7z" />
    </svg>
  ),
  Sparkle: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />
    </svg>
  ),
  Leaf: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M5 19c0-10 6-14 14-14 0 8-4 14-14 14z" />
      <path d="M5 19L13 11" />
    </svg>
  ),
  Heart: ({ size = 14, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 21s-7-4.5-9.5-9C1 9 3 5 7 5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6 4 4.5 7-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  ),
  Dots: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  ),
  X: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Lock: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  ),
  Out: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l4-12 14-2-2 14z" />
      <path d="M9 13l3 3 5-5" />
    </svg>
  ),
  Chef: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M6 13c-2 0-3-2-3-4s2-3 4-3c0-2 2-3 5-3s5 1 5 3c2 0 4 1 4 3s-1 4-3 4v6H6v-6z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  ),
  Trash: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 4h4l1 3H9zM6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </svg>
  ),
  Info: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" />
    </svg>
  ),
};

window.G = G;
window.FoodGlyph = FoodGlyph;
window.Icon = Icon;
