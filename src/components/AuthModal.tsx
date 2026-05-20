import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { Icon } from './Icons'
import { isFirebaseEnabled } from '../lib/firebase'

const GoogleG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.6c-.2 1.3-1 2.4-2 3.2v2.6h3.3c1.9-1.8 3.1-4.4 3.1-7.8z"/>
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.6c-.9.6-2 1-3.3 1-2.6 0-4.7-1.7-5.5-4.1H3.2v2.6C4.9 19.7 8.2 22 12 22z"/>
    <path fill="#FBBC05" d="M6.5 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.5H3.2C2.4 9 2 10.4 2 12s.4 3 1.2 4.5l3.3-2.6z"/>
    <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3 14.7 2 12 2 8.2 2 4.9 4.3 3.2 7.5l3.3 2.6C7.3 7.7 9.4 6 12 6z"/>
  </svg>
)

const AppleLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 12.04c0-2.94 2.41-4.36 2.52-4.42-1.38-2.01-3.52-2.29-4.28-2.32-1.82-.19-3.55 1.07-4.47 1.07-.93 0-2.34-1.05-3.86-1.02-1.98.03-3.82 1.15-4.84 2.93-2.07 3.58-.53 8.86 1.49 11.77.99 1.42 2.16 3.02 3.7 2.96 1.49-.06 2.05-.96 3.85-.96 1.79 0 2.31.96 3.88.93 1.6-.03 2.62-1.45 3.6-2.87 1.13-1.65 1.6-3.25 1.63-3.33-.04-.02-3.13-1.2-3.16-4.74zM14.6 4.05c.82-1 1.38-2.39 1.23-3.78-1.18.05-2.62.79-3.47 1.79-.76.88-1.43 2.29-1.25 3.65 1.32.1 2.66-.67 3.49-1.66z"/>
  </svg>
)

export function AuthModal() {
  const { authOpen, setAuthOpen, signIn, user } = useStore()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState(user.email)

  if (!authOpen) return null

  return (
    <div className="overlay" onClick={() => setAuthOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <button className="modal-close" onClick={() => setAuthOpen(false)}><Icon.X /></button>
        <div className="eyebrow mb-2">{mode === 'signin' ? 'Welcome back' : 'Create account'}</div>
        <h2 className="h-1" style={{ fontSize: 30 }}>
          {mode === 'signin' ? <>Save your week.</> : <>Start <em>cookin'.</em></>}
        </h2>
        <p className="muted mt-2" style={{ fontSize: 14 }}>
          {mode === 'signin'
            ? 'Sign in to sync plans, favorites and grocery lists across devices.'
            : "Free to start. Your preferences and meal plans get saved to the cloud."}
        </p>

        {!isFirebaseEnabled && (
          <div className="info-card mt-4" style={{ fontSize: 13 }}>
            Firebase is not configured — sign-in is unavailable in this build.
            See <strong>.env.local.example</strong> for setup instructions.
          </div>
        )}

        <div className="col gap-2 mt-6">
          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'center', width: '100%', padding: '12px' }}
            disabled={!isFirebaseEnabled}
            onClick={signIn}>
            <GoogleG /> Continue with Google
          </button>
          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'center', width: '100%', padding: '12px' }}
            disabled>
            <AppleLogo /> Continue with Apple
          </button>
        </div>

        <div className="divider"><span>or with email</span></div>

        <div className="col gap-3">
          <div>
            <label className="field-label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="input" type="password" defaultValue="••••••••" placeholder="At least 8 characters" />
          </div>
        </div>

        <button
          className="btn btn-accent mt-4"
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          disabled>
          {mode === 'signin' ? 'Sign in with email' : 'Create my account'} <Icon.Arrow />
        </button>

        <div className="muted mt-6" style={{ fontSize: 13, textAlign: 'center' }}>
          {mode === 'signin' ? (
            <>New here? <button className="text-link" onClick={() => setMode('signup')}>Create account</button></>
          ) : (
            <>Already have one? <button className="text-link" onClick={() => setMode('signin')}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}
