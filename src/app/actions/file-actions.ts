'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Moves a file to a new folder by updating its folderId in Firestore.
 * This is a server action callable from client components.
 * @param fileId The ID of the file to move.
 * @param newFolderId The ID of the destination folder.
 * @returns An object indicating success or failure.
 */
export async function moveFile(fileId: string, newFolderId: string): Promise<{ success: boolean; error?: string }> {
    if (!fileId || !newFolderId) {
        return { success: false, error: 'File ID and new folder ID are required.' };
    }

    try {
        const fileRef = db.collection('files').doc(fileId);
        await fileRef.update({
            folderId: newFolderId,
            modifiedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error moving file in server action:", error);
        return { success: false, error: error.message || "An unknown error occurred on the server." };
    }
}
