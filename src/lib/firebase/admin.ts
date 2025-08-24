/**
 * Firebase Admin SDK configuration for server-side operations
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const hasCreds = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
  if (hasCreds) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } else {
    // Fallback init without credentials (only if emulator/public read operations) to avoid build crash
    initializeApp();
  }
}

export const adminFirestore = getFirestore();
export const adminStorage = getStorage();
