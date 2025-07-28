
'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
    const docRef = db.collection(PROFILES_COLLECTION).doc(userId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
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
    const docRef = db.collection(PROFILES_COLLECTION).doc(userId);
    const docSnap = await docRef.get();

    const dataWithTimestamp: { [key: string]: any } = {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
    };

    if (docSnap.exists) {
        await docRef.update(dataWithTimestamp);
    } else {
        dataWithTimestamp.email = email;
        dataWithTimestamp.createdAt = FieldValue.serverTimestamp();
        await docRef.set(dataWithTimestamp);
    }
}
