
'use client';

// This service is being deprecated. Its functionality is being merged into
// the main file-service.ts to create a single, reliable source of truth
// for all file and folder operations and to resolve persistent bugs.
// All components should now use file-service.ts instead.
// This file can be safely removed in the future.

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

console.warn("DEPRECATION WARNING: knowledge-base-service.ts is deprecated. Use file-service.ts instead.");

async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}
