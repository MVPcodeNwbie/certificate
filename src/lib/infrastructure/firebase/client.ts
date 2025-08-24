import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_MEASUREMENT_ID,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET
} from '$env/static/public';

// Runtime config sourced from Vite public env vars. Avoid hardcoding secrets.
// Provided example values can be placed into .env as:
// VITE_PUBLIC_FIREBASE_API_KEY=...
// VITE_PUBLIC_FIREBASE_PROJECT_ID=certificate-28ef3
// etc.
const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY || 'demo-key',
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
	projectId: PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET || 'certificate-28ef3.firebasestorage.app',
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '0000000000',
	appId: PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
	measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional Analytics (only in browser + measurementId present). Avoid SSR errors.
let analytics: import('firebase/analytics').Analytics | undefined;
if (typeof window !== 'undefined' && PUBLIC_FIREBASE_MEASUREMENT_ID) {
	import('firebase/analytics').then(({ getAnalytics }) => {
		try { analytics = getAnalytics(app); } catch {}
	}).catch(() => {});
}
export { analytics };
