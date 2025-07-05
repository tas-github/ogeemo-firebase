
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, browserLocalPersistence } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Determine the correct authDomain based on the environment.
// This is the core fix for the redirect_uri_mismatch error.
let effectiveAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
if (typeof window !== "undefined") {
  // In the browser, the auth domain MUST match the current site's hostname.
  effectiveAuthDomain = window.location.hostname;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: effectiveAuthDomain,
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

if (firebaseConfig.apiKey) {
  try {
    // Initialize Firebase with the dynamically corrected config.
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    auth = getAuth(app);
    auth.setPersistence(browserLocalPersistence);

    db = getFirestore(app);
    storage = getStorage(app);
    provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
    console.warn("Firebase configuration is missing. Firebase services will be disabled.");
}

export { app, auth, db, storage, provider };
