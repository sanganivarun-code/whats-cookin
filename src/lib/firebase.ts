// Firebase initialization.
// Only runs when all four required env vars are present so the app works
// in local-only mode (no .env.local) without throwing at startup.
//
// Required vars (set in .env.local — never commit that file):
//   VITE_FIREBASE_API_KEY
//   VITE_FIREBASE_AUTH_DOMAIN
//   VITE_FIREBASE_PROJECT_ID
//   VITE_FIREBASE_APP_ID
//
// Optional vars (set for a complete Firebase project):
//   VITE_FIREBASE_STORAGE_BUCKET
//   VITE_FIREBASE_MESSAGING_SENDER_ID

import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function createServices() {
  // Read only the four keys we need to verify before initializing
  const apiKey     = import.meta.env.VITE_FIREBASE_API_KEY     as string | undefined
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined
  const projectId  = import.meta.env.VITE_FIREBASE_PROJECT_ID  as string | undefined
  const appId      = import.meta.env.VITE_FIREBASE_APP_ID      as string | undefined

  if (!apiKey || !authDomain || !projectId || !appId) return null

  const app = getApps().length > 0
    ? getApps()[0]!
    : initializeApp({
        apiKey,
        authDomain,
        projectId,
        storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string | undefined,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
        appId,
      })

  return {
    auth:           getAuth(app),
    db:             getFirestore(app),
    googleProvider: new GoogleAuthProvider(),
  }
}

// Null when env vars are missing — callers guard with `if (firebaseServices)`.
export const firebaseServices = createServices()

// Convenience flag; importing components can avoid the null check for simple guards.
export const isFirebaseEnabled = firebaseServices !== null
