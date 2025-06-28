
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth";
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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let provider: GoogleAuthProvider | null = null;

if (firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    provider = new GoogleAuthProvider();
    // Request scope to create new files in the user's Google Drive.
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    // Request read-only access to the user's contacts.
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // This will keep app, auth, db, and storage as null if initialization fails
  }
} else {
    console.warn("Firebase configuration is missing. Firebase services will be disabled.");
}

export { app, auth, db, storage, provider };
