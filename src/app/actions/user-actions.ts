'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { UserRecord } from 'firebase-admin/auth';

/**
 * Fetches all users from Firebase Authentication.
 * This is a server action and should be called from server components or other server actions.
 * @returns An array of user records.
 */
export async function getAllAuthUsers(): Promise<UserRecord[]> {
  try {
    const listUsersResult = await adminAuth.listUsers();
    return listUsersResult.users;
  } catch (error: any) {
    console.error("Error fetching all auth users:", error);
    // In a real app, you might want more granular error handling
    throw new Error("Could not fetch user list from Firebase Authentication.");
  }
}

/**
 * Deletes a user from Firebase Authentication by their UID.
 * This is a server action callable from client components.
 * @param uid The UID of the user to delete.
 * @returns An object indicating success or failure.
 */
export async function deleteAuthUser(uid: string): Promise<{ success: boolean; error?: string }> {
  if (!uid) {
    return { success: false, error: 'User ID is required.' };
  }

  try {
    await adminAuth.deleteUser(uid);
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting user ${uid}:`, error);
    return { success: false, error: error.message || "An unknown server error occurred." };
  }
}
