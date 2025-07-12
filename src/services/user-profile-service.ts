
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface UserProfile {
    id: string; // This will be the user's UID
    email: string;
    businessPhone?: string;
    cellPhone?: string;
    bestPhone?: 'business' | 'cell';
    businessAddress?: string;
    homeAddress?: string;
    alternateContact?: string;
    createdAt: any;
    updatedAt: any;
}

const PROFILES_COLLECTION = 'userProfiles';

function checkDb() {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    checkDb();
    const docRef = doc(db, PROFILES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    } else {
        return null;
    }
}

export async function updateUserProfile(
    userId: string, 
    email: string,
    data: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
    checkDb();
    const docRef = doc(db, PROFILES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    const dataWithTimestamp = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    if (docSnap.exists()) {
        await updateDoc(docRef, dataWithTimestamp);
    } else {
        await setDoc(docRef, {
            ...dataWithTimestamp,
            email,
            createdAt: serverTimestamp(),
        });
    }
}
