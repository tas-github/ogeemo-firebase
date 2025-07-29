
'use client';

import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

export interface UserProfile {
    id: string; // This will be the user's UID
    email: string;
    businessPhone?: string;
    cellPhone?: string;
    bestPhone?: 'business' | 'cell';
    businessAddress?: string;
    homeAddress?: string;
    alternateContact?: string;
    alternateContactPhone?: string;
    createdAt?: any;
    updatedAt?: any;
}

const PROFILES_COLLECTION = 'userProfiles';

async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const db = await getDb();
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
    const db = await getDb();
    const docRef = doc(db, PROFILES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    const dataWithTimestamp: { [key: string]: any } = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    if (docSnap.exists()) {
        await updateDoc(docRef, dataWithTimestamp);
    } else {
        dataWithTimestamp.email = email;
        dataWithTimestamp.createdAt = serverTimestamp();
        await setDoc(docRef, dataWithTimestamp);
    }
}
