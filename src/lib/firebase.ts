
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";
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
  provider: GoogleAuthProvider;
};

let firebaseServices: FirebaseServices | null = null;

// This function is now async to properly handle persistence setup.
export async function initializeFirebase(): Promise<FirebaseServices> {
    if (firebaseServices) {
        return firebaseServices;
    }
    
    if (typeof window === 'undefined') {
        // This case should ideally not be hit by client components.
        // If a server component needs Firebase, it should use the Admin SDK.
        throw new Error("Firebase client SDK can only be initialized in the browser.");
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        const missingVars = [
            !firebaseConfig.apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
            !firebaseConfig.projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        ].filter(Boolean).join(", ");
        console.error(`Firebase configuration is missing: ${missingVars}. Firebase services will be disabled.`);
        throw new Error("Firebase configuration is incomplete.");
    }
    
    if (!firebaseConfig.authDomain && firebaseConfig.projectId) {
        firebaseConfig.authDomain = `${firebaseConfig.projectId}.firebaseapp.com`;
    }

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    
    // Awaiting persistence ensures auth is ready before we use it.
    await setPersistence(auth, browserLocalPersistence);

    firebaseServices = { app, auth, db, storage, provider };
    
    return firebaseServices;
}

// A new getter for db to be used by server components (with caution).
// This avoids client-side checks and async logic.
// This is a workaround for the current architecture. A proper fix would involve the Admin SDK.
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
