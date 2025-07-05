
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, browserLocalPersistence } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // The authDomain is set dynamically below, only on the client-side.
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let provider: GoogleAuthProvider | null = null;

// Ensure Firebase is only initialized on the client-side
if (typeof window !== "undefined" && firebaseConfig.apiKey) {
    try {
        const clientSideConfig = {
            ...firebaseConfig,
            authDomain: window.location.hostname,
        };

        app = !getApps().length ? initializeApp(clientSideConfig) : getApp();
        
        auth = getAuth(app);
        // This must be client-side only.
        auth.setPersistence(browserLocalPersistence);

        db = getFirestore(app);
        storage = getStorage(app);
        provider = new GoogleAuthProvider();
        
        provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
        provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        
    } catch (error) {
        console.error("Firebase initialization error:", error);
    }
} else if (typeof window !== "undefined" && !firebaseConfig.apiKey) {
    // Only show this warning on the client to avoid server-side noise
    console.warn("Firebase configuration is missing. Firebase services will be disabled.");
}

export { app, auth, db, storage, provider };
