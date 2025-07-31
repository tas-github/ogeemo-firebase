// src/app/actions.ts
'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

/**
 * A server action to reliably get the current user's UID from the session cookie.
 * This is the recommended pattern for accessing user identity in Server Components.
 */
export async function getCurrentUserId(): Promise<string | null> {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        return null;
    }
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken.uid;
    } catch (error) {
        console.error('Error verifying session cookie in server action:', error);
        return null;
    }
}
