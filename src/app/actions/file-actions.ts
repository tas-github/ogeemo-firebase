
'use server';

import { adminDb as db, getAdminStorage } from '@/lib/firebase-admin';
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

/**
 * Generates a signed URL for downloading a file from Firebase Storage.
 * @param storagePath The full path to the file in the storage bucket.
 * @returns An object with the URL or an error.
 */
export async function getDownloadUrl(storagePath: string): Promise<{ url?: string; error?: string }> {
    if (!storagePath) {
        return { error: 'Storage path is required.' };
    }

    try {
        const bucket = getAdminStorage().bucket();
        const file = bucket.file(storagePath);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });
        return { url };
    } catch (error: any) {
        console.error("Error generating download URL:", error);
        return { error: error.message || "An unknown error occurred." };
    }
}

/**
 * Fetches the content of a text-based file directly from Firebase Storage.
 * @param storagePath The full path to the file in the storage bucket.
 * @returns An object with the file content as a string, or an error.
 */
export async function fetchFileContent(storagePath: string): Promise<{ content?: string; error?: string }> {
    if (!storagePath) {
        return { error: 'Storage path is required.' };
    }

    try {
        const bucket = getAdminStorage().bucket();
        const file = bucket.file(storagePath);
        
        // Download the file contents into a buffer and convert to a string.
        const [contents] = await file.download();
        return { content: contents.toString('utf8') };
    } catch (error: any) {
        console.error("Error fetching file content in server action:", error);
        return { error: error.message || "An unknown server error occurred while fetching the file." };
    }
}
