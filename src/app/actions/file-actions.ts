'use server';

// This file is no longer needed because all file operations are handled on the client-side
// via the file-service.ts to ensure reliability and correct functioning of the editor.
// It is kept for reference but its functions are now deprecated.

import { getStorage, getDownloadURL, ref } from 'firebase/storage';
import { initializeFirebase } from '@/lib/firebase';


export async function fetchFileContent(storagePath: string): Promise<{ content?: string; error?: string }> {
    try {
        const { storage } = await initializeFirebase();
        const fileRef = ref(storage, storagePath);
        const downloadUrl = await getDownloadURL(fileRef);

        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }
        
        return { content: await response.text() };

    } catch (error: any) {
        console.error("Error fetching file content:", error);
        return { error: error.message || "An unknown error occurred." };
    }
}
