import { useState, useEffect } from 'react'
import type { AppRoute } from '../types/store'
import { useStore } from '../context/StoreContext'
import { Icon } from '../components/Icons'

interface LoadingProps {
  go: (r: AppRoute) => void
  nextRoute?: AppRoute
  minDelay?: number  // minimum milliseconds to show the loading screen (default 2000)
}

const COOKING_QUOTES = [
  'Whisking together a plan…',
  'Letting it simmer…',
  'Plating up your week…',
  'Marinating your preferences…',
  'Folding in the flavors…',
  'Putting the kettle on…',
  'Calibrating the spice rack…',
  'Stirring in your goals…',
]

const ChefHat = () => (
  <svg viewBox="-60 -60 120 120" width="100%" height="100%" fill="none"
    stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="0" cy="-15" rx="42" ry="34" />
    <rect x="-38" y="18" width="76" height="28" rx="5" />
    <line x1="-15" y1="-25" x2="-15" y2="5" />
    <line x1="0" y1="-30" x2="0" y2="5" />
    <line x1="15" y1="-25" x2="15" y2="5" />
  </svg>
)

const LoadPot = () => (
  <svg viewBox="-60 -60 120 120" width="100%" height="100%" fill="none"
    stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="-55" y1="-22" x2="55" y2="-22" />
    <path d="M-42 -22 L-42 30 Q-42 48 -24 48 L24 48 Q42 48 42 30 L42 -22" />
    <line x1="-62" y1="-12" x2="-47" y2="-12" />
    <line x1="47" y1="-12" x2="62" y2="-12" />
  </svg>
)

const SteamBowl = () => (
  <svg viewBox="-60 -60 120 120" width="100%" height="100%" fill="none"
    stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-46 5 Q-46 45 0 45 Q46 45 46 5 Z" />
    <line x1="-46" y1="5" x2="46" y2="5" />
    <path d="M-20 -38 Q-10 -25 -20 -12" strokeWidth="5" />
    <path d="M3 -50 Q13 -36 3 -22" strokeWidth="5" />
    <path d="M24 -40 Q34 -26 24 -12" strokeWidth="5" />
  </svg>
)

const Loaf = () => (
  <svg viewBox="-60 -60 120 120" width="100%" height="100%" fill="none"
    stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-48 22 Q-48 -22 0 -28 Q48 -22 48 22 Z" />
    <line x1="-28" y1="-10" x2="-15" y2="-22" strokeWidth="5" />
    <line x1="-10" y1="-15" x2="3" y2="-26" strokeWidth="5" />
    <line x1="8" y1="-12" x2="20" y2="-22" strokeWidth="5" />
  </svg>
)

export function Loading({ go, nextRoute = 'dashboard', minDelay = 2000 }: LoadingProps) {
  const { generationLoading, generationError, generatePlanAsync, onboardingState, viewSamplePlan } = useStore()
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * COOKING_QUOTES.length))
  const [iconIdx, setIconIdx] = useState(0)
  const [minDelayDone, setMinDelayDone] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Cycle the visual animation independently of navigation logic
  useEffect(() => {
    const ti = setInterval(() => setIconIdx((i) => (i + 1) % 4), 700)
    const tq = setInterval(() => setQuoteIdx((i) => (i + 1) % COOKING_QUOTES.length), 1800)
    return () => { clearInterval(ti); clearInterval(tq) }
  }, [])

  // Enforce a minimum display time; resets on each retry attempt
  useEffect(() => {
    setMinDelayDone(false)
    const t = setTimeout(() => setMinDelayDone(true), minDelay)
    return () => clearTimeout(t)
  }, [minDelay, retryCount])

  // Navigate once generation is complete, min delay passed, and no error
  useEffect(() => {
    if (!generationLoading && minDelayDone && !generationError) {
      go(nextRoute)
    }
  }, [generationLoading, minDelayDone, generationError, go, nextRoute])

  const handleRetry = () => {
    if (!onboardingState) return
    setRetryCount((c) => c + 1)
    generatePlanAsync(onboardingState)
  }

  const handleViewSample = () => {
    viewSamplePlan()
    go('dashboard')
  }

  // Error state: generation finished with an error — show recovery options
  if (!generationLoading && minDelayDone && generationError) {
    return (
      <div className="loading-screen">
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--bg-warm)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Icon.Sparkle size={22} />
          </div>
          <h2 className="h-2" style={{ marginBottom: 10 }}>AI generation hit a snag</h2>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            {generationError}
          </p>
          <div className="col gap-3" style={{ alignItems: 'center' }}>
            {onboardingState && (
              <button className="btn btn-accent" onClick={handleRetry}>
                <Icon.Sparkle /> Try again
              </button>
            )}
            <button className="btn btn-ghost" onClick={handleViewSample}>
              View sample plan
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="loading-screen">
      <div className="loading-stage">
        <div className="halo" />
        <div className="spinner-ring" />
        <div className="loading-brand-circle">
          <div className="loading-icon-stack">
            <span className={`li${iconIdx === 0 ? ' on' : ''}`}><ChefHat /></span>
            <span className={`li${iconIdx === 1 ? ' on' : ''}`}><LoadPot /></span>
            <span className={`li${iconIdx === 2 ? ' on' : ''}`}><SteamBowl /></span>
            <span className={`li${iconIdx === 3 ? ' on' : ''}`}><Loaf /></span>
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
        <span /><span /><span />
      </div>
    </div>
  )
}
