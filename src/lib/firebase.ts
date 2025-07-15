
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

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

// This promise will be resolved with the initialized services.
let firebaseServicesPromise: Promise<FirebaseServices> | null = null;

async function _initializeFirebase(): Promise<FirebaseServices> {
    if (typeof window === 'undefined') {
        throw new Error("Firebase client SDK can only be initialized in the browser.");
    }

    if (!firebaseConfig.authDomain && firebaseConfig.projectId) {
        firebaseConfig.authDomain = `${firebaseConfig.projectId}.firebaseapp.com`;
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        const missingVars = [
            !firebaseConfig.apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
            !firebaseConfig.projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        ].filter(Boolean).join(", ");
        
        throw new Error(`Firebase configuration is incomplete. Missing: ${missingVars}`);
    }
    
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    
    // This is the key step that needs to be awaited. It ensures that
    // the persistence layer is ready before any auth operations are attempted.
    await setPersistence(auth, browserLocalPersistence);

    return { app, auth, db, storage };
}

export function initializeFirebase(): Promise<FirebaseServices> {
    if (!firebaseServicesPromise) {
        firebaseServicesPromise = _initializeFirebase();
    }
    return firebaseServicesPromise;
}

// These server-side getters are for use in server components/actions
// that do not rely on browser persistence.
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
