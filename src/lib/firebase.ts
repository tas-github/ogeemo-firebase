
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

// This promise will be resolved with the initialized services, acting as a singleton.
let firebaseServicesPromise: Promise<FirebaseServices> | null = null;

export function initializeFirebase(): Promise<FirebaseServices> {
    if (firebaseServicesPromise) {
        return firebaseServicesPromise;
    }

    firebaseServicesPromise = (async () => {
        if (typeof window === 'undefined') {
            throw new Error("Firebase client SDK can only be initialized in the browser.");
        }

        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            const missingVars = [
                !firebaseConfig.apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
                !firebaseConfig.projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
            ].filter(Boolean).join(", ");
            
            throw new Error(`Firebase configuration is incomplete. Missing environment variables: ${missingVars}`);
        }

        if (!firebaseConfig.authDomain) {
            firebaseConfig.authDomain = `${firebaseConfig.projectId}.firebaseapp.com`;
        }
        
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);
        
        // setPersistence ensures that the user's authentication state is persisted.
        // It's crucial to await this before considering initialization complete.
        await setPersistence(auth, browserLocalPersistence);

        return { app, auth, db, storage };
    })();
    
    return firebaseServicesPromise;
}
