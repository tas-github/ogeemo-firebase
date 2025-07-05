
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com` : undefined),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This structure allows for lazy initialization of Firebase services on the client side.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let provider: GoogleAuthProvider | null = null;

function initializeFirebase() {
    if (typeof window !== "undefined") {
        if (!getApps().length) {
            if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
                 console.error("Firebase configuration is missing API Key or Project ID. Firebase services will be disabled.");
                 return;
            }
            app = initializeApp(firebaseConfig);
        } else {
            app = getApp();
        }

        auth = getAuth(app);
        // Set persistence to avoid re-authentication on page refresh.
        setPersistence(auth, browserLocalPersistence);

        db = getFirestore(app);
        storage = getStorage(app);
        provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
        provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    }
}

// Call initialization immediately so services are available for import.
initializeFirebase();

export { app, auth, db, storage, provider };
