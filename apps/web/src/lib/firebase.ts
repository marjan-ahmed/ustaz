// src/lib/firebase.ts
// Firebase client initialisation for FCM web push.
// Import this in client components only — it calls getMessaging() which
// requires a browser environment.
//
// All values are driven by NEXT_PUBLIC_* env vars set in .env.local.
// The only thing needed at runtime is the Firebase config + VAPID public key.

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton — reuse the app across hot-reloads in dev
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

/**
 * Returns the Messaging instance.
 * Only call this inside a useEffect (browser-only).
 */
export function getFirebaseMessaging(): Messaging {
  return getMessaging(app);
}

export { app };
