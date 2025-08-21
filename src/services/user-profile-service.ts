
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
    preferences?: {
        showDictationButton?: boolean;
        showDashboardFrame?: boolean;
        showMenuViewInstructions?: boolean;
        menuOrder?: string[];
        googleAppsOrder?: string[];
        fileFolderOrder?: string[];
    };
}

const PROFILES_COLLECTION = 'userProfiles';

async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

const defaultPreferences = {
    showDictationButton: true,
    showDashboardFrame: true,
    showMenuViewInstructions: true,
    menuOrder: [],
    googleAppsOrder: [],
    fileFolderOrder: [],
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const db = await getDb();
    const docRef = doc(db, PROFILES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Merge fetched preferences with defaults to ensure all keys are present
        const preferences = { ...defaultPreferences, ...(data.preferences || {}) };
        return { id: docSnap.id, ...data, preferences } as UserProfile;
    } else {
        // Return a default profile for a new user
        return {
            id: userId,
            email: '', // This should be populated on creation
            preferences: defaultPreferences,
        };
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
        const existingData = docSnap.data();
        const existingPrefs = existingData.preferences || {};
        dataWithTimestamp.preferences = { ...existingPrefs, ...data.preferences };
        await updateDoc(docRef, dataWithTimestamp);
    } else {
        dataWithTimestamp.email = email;
        dataWithTimestamp.createdAt = serverTimestamp();
        // Ensure preferences field is created for new users, merging with any provided data
        dataWithTimestamp.preferences = { ...defaultPreferences, ...(data.preferences || {}) };
        await setDoc(docRef, dataWithTimestamp);
    }
}
