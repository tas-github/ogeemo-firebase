
'use server';

import { adminDb as db, getAdminStorage } from '@/lib/firebase-admin';

/**
 * Fetches the content of a text-based file directly from Firebase Storage.
 * This function is specific to the knowledge base storage path.
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
