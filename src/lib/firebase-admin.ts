// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getStorage as getAdminStorageSdk } from 'firebase-admin/storage';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // This will likely happen in client-side rendering or if the env var is not set.
    // The functions using this should handle the case where admin is not initialized.
    console.warn("Firebase Admin SDK not initialized. Service account key is missing.");
  }
}

export const getAdminStorage = () => {
    if (!admin.apps.length) {
        throw new Error("Firebase Admin SDK is not initialized.");
    }
    return getAdminStorageSdk();
};

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
