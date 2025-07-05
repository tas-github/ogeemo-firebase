
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

export function initializeFirebase(): FirebaseServices {
    if (typeof window === 'undefined') {
        throw new Error("Firebase can only be initialized in a browser environment.");
    }
    
    if (!firebaseServices) {
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            const missingVars = [
                !firebaseConfig.apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
                !firebaseConfig.projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
            ].filter(Boolean).join(", ");
            console.error(`Firebase configuration is missing: ${missingVars}. Firebase services will be disabled.`);
            throw new Error("Firebase configuration is incomplete.");
        }
        
        // Construct authDomain if not provided, which is common in some environments
        if (!firebaseConfig.authDomain && firebaseConfig.projectId) {
            firebaseConfig.authDomain = `${firebaseConfig.projectId}.firebaseapp.com`;
        }

        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        setPersistence(auth, browserLocalPersistence);
        
        const db = getFirestore(app);
        const storage = getStorage(app);
        
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
        provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

        firebaseServices = { app, auth, db, storage, provider };
    }
    
    return firebaseServices;
}
