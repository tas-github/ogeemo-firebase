
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

let firebaseServices: FirebaseServices | null = null;

export async function initializeFirebase(): Promise<FirebaseServices> {
    if (firebaseServices) {
        return firebaseServices;
    }
    
    if (typeof window === 'undefined') {
        throw new Error("Firebase client SDK can only be initialized in the browser.");
    }

    // Auto-populate authDomain if missing, which is common in some environments.
    if (!firebaseConfig.authDomain && firebaseConfig.projectId) {
        firebaseConfig.authDomain = `${firebaseConfig.projectId}.firebaseapp.com`;
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        const missingVars = [
            !firebaseConfig.apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
            !firebaseConfig.projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        ].filter(Boolean).join(", ");
        console.error(`Firebase configuration is missing: ${missingVars}. Firebase services will be disabled.`);
        throw new Error(`Firebase configuration is incomplete. Missing: ${missingVars}`);
    }
    
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    
    await setPersistence(auth, browserLocalPersistence);

    firebaseServices = { app, auth, db, storage };
    
    return firebaseServices;
}

// This function is for server-side usage where persistence is not a concern.
const getDbForServer = () => {
    if (!getApps().length) {
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
           return null;
        }
        const app = initializeApp(firebaseConfig);
        return getFirestore(app);
    }
    return getFirestore();
};
export const db = getDbForServer();

const getStorageForServer = () => {
    if (!getApps().length) {
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
           return null;
        }
        const app = initializeApp(firebaseConfig);
        return getStorage(app);
    }
    return getStorage();
};
export const storage = getStorageForServer();
