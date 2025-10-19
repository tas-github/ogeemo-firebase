'use server';

import { adminDb, getAdminStorage } from '@/lib/firebase-admin';
import { type FileItem } from '@/data/files';

const FILES_COLLECTION = 'files';

function checkDb() {
  if (!adminDb) {
    throw new Error('Firestore Admin SDK is not initialized.');
  }
}

export async function addTextFile(userId: string, folderId: string, fileName: string, content: string = ''): Promise<FileItem> {
  checkDb();

  const fileBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const storage = getAdminStorage();
  const bucket = storage.bucket();

  const storagePath = `userFiles/${userId}/${folderId}/${Date.now()}-${fileName}.txt`;
  const file = bucket.file(storagePath);

  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  await file.save(buffer, {
    metadata: {
      contentType: 'text/plain;charset=utf-8',
    },
  });

  const newFileRecord: Omit<FileItem, 'id'> = {
    name: fileName,
    type: 'text/plain',
    size: fileBlob.size,
    modifiedAt: new Date(),
    folderId,
    userId,
    storagePath,
  };

  const docRef = await adminDb.collection(FILES_COLLECTION).add(newFileRecord);

  return { id: docRef.id, ...newFileRecord };
}

export async function fetchFileContent(storagePath: string): Promise<{ content?: string; error?: string }> {
    checkDb();
    try {
        const bucket = getAdminStorage().bucket();
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();
        if (!exists) {
            return { error: 'File not found in storage.' };
        }
        const [buffer] = await file.download();
        // Check for common text-based types before assuming utf-8
        // A more robust solution might check the file's metadata for content type
        return { content: buffer.toString('utf-8') };
    } catch (error: any) {
        console.error("Error fetching file content:", error);
        return { error: error.message || "An unknown error occurred." };
    }
}
