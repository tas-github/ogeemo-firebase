// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getStorage as getAdminStorageSdk } from 'firebase-admin/storage';

let adminApp: admin.app.App;

// This function acts as a singleton to ensure the Firebase Admin SDK is initialized only once.
const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. The application cannot connect to Firebase services on the server.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return adminApp;
  } catch (e: any) {
    throw new Error(`Failed to parse Firebase service account key. Please ensure it is a valid JSON string. Error: ${e.message}`);
  }
};

// Call the function to ensure the admin app is initialized before any services are exported.
initializeFirebaseAdmin();

// Export initialized services
export const getAdminStorage = () => getAdminStorageSdk(adminApp);
export const adminDb = admin.firestore(adminApp);
export const adminAuth = admin.auth(adminApp);
