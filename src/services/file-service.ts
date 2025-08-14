
'use server';

import { adminDb as db, getAdminStorage } from '@/lib/firebase-admin';
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  FieldValue,
} from 'firebase-admin/firestore';
import { type FileItem, type FolderItem } from '@/data/files';

const FOLDERS_COLLECTION = 'fileFolders';
const FILES_COLLECTION = 'files';

function checkDb() {
    if (!db) throw new Error("Firestore is not initialized.");
}

// --- Type Converters ---
const docToFolder = (doc: QueryDocumentSnapshot<DocumentData>): FolderItem => ({ id: doc.id, ...doc.data() } as FolderItem);
const docToFile = (doc: QueryDocumentSnapshot<DocumentData>): FileItem => {
    const data = doc.data();
    return { 
        id: doc.id, 
        ...data,
        modifiedAt: data.modifiedAt?.toDate ? data.modifiedAt.toDate() : new Date(),
    } as FileItem;
};

// --- Folder Functions ---
export async function getFolders(userId: string): Promise<FolderItem[]> {
    checkDb();
    const q = db.collection(FOLDERS_COLLECTION).where("userId", "==", userId);
    const snapshot = await q.get();
    return snapshot.docs.map(docToFolder);
}

export async function findOrCreateFileFolder(userId: string, folderName: string, parentId: string | null = null): Promise<FolderItem> {
    checkDb();
    const q = db.collection(FOLDERS_COLLECTION)
        .where("userId", "==", userId)
        .where("name", "==", folderName)
        .where("parentId", "==", parentId);
    
    const snapshot = await q.get();
    
    if (!snapshot.empty) {
        return docToFolder(snapshot.docs[0]);
    } else {
        const newFolderData = {
            name: folderName,
            userId,
            parentId,
        };
        return addFolder(newFolderData);
    }
}


export async function addFolder(folderData: Omit<FolderItem, 'id'>): Promise<FolderItem> {
    checkDb();
    const docRef = await db.collection(FOLDERS_COLLECTION).add({ ...folderData, parentId: folderData.parentId || null });
    return { id: docRef.id, ...folderData };
}

export async function updateFolder(folderId: string, folderData: Partial<Omit<FolderItem, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    await db.collection(FOLDERS_COLLECTION).doc(folderId).update(folderData);
}

export async function deleteFolderAndContents(userId: string, folderId: string): Promise<void> {
    checkDb();
    const batch = db.batch();
    const allFoldersSnapshot = await db.collection(FOLDERS_COLLECTION).where("userId", "==", userId).get();
    const allFolders = allFoldersSnapshot.docs.map(docToFolder);
    
    const folderIdsToDelete = new Set<string>([folderId]);
    const findDescendants = (parentId: string) => {
        allFolders.filter(f => f.parentId === parentId).forEach(child => {
            folderIdsToDelete.add(child.id);
            findDescendants(child.id);
        });
    };
    findDescendants(folderId);

    const filesQuery = db.collection(FILES_COLLECTION).where('folderId', 'in', Array.from(folderIdsToDelete));
    const filesSnapshot = await filesQuery.get();
    
    for (const fileDoc of filesSnapshot.docs) {
        const fileData = fileDoc.data() as FileItem;
        if (fileData.storagePath) {
            const fileRef = getAdminStorage().bucket().file(fileData.storagePath);
            await fileRef.delete().catch(error => {
                if (error.code !== 404) { // 404 means not found, which is fine
                    console.error(`Failed to delete file from storage: ${fileData.storagePath}`, error);
                }
            });
        }
        batch.delete(fileDoc.ref);
    }

    folderIdsToDelete.forEach(id => {
        batch.delete(db.collection(FOLDERS_COLLECTION).doc(id));
    });

    await batch.commit();
}

// --- File Functions ---

export async function getFiles(userId: string): Promise<FileItem[]> {
    checkDb();
    const q = db.collection(FILES_COLLECTION).where("userId", "==", userId);
    const snapshot = await q.get();
    return snapshot.docs.map(docToFile);
}

export async function getUploadUrl(data: {
  fileName: string;
  fileType: string;
  userId: string;
  folderId: string;
}): Promise<{ signedUrl: string; storagePath: string; }> {
    const { fileName, fileType, userId, folderId } = data;

    if (!fileName || !fileType || !userId || !folderId) {
        throw new Error("Missing required parameters for getting upload URL.");
    }
    
    const bucket = getAdminStorage().bucket();
    const storagePath = `${userId}/${folderId}/${Date.now()}-${fileName}`;
    const file = bucket.file(storagePath);
    
    const options = {
        version: 'v4' as const,
        action: 'write' as const,
        expires: Date.now() + 5 * 60 * 1000, // 5 minutes
        contentType: fileType,
    };
    
    const [url] = await file.getSignedUrl(options);
    
    return { signedUrl: url, storagePath };
}

export async function addFileRecord(fileData: Omit<FileItem, 'id'>): Promise<FileItem> {
    checkDb();
    const dataWithTimestamp = { ...fileData, modifiedAt: FieldValue.serverTimestamp() };
    const docRef = await db.collection(FILES_COLLECTION).add(dataWithTimestamp);
    const docSnap = await docRef.get();
    return docToFile(docSnap);
}

export async function getFilesForFolder(userId: string, folderId: string): Promise<FileItem[]> {
    checkDb();
    const q = db.collection(FILES_COLLECTION).where("userId", "==", userId).where("folderId", "==", folderId);
    const snapshot = await q.get();
    return snapshot.docs.map(docToFile);
}

export async function deleteFiles(fileIds: string[]): Promise<void> {
    checkDb();
    const batch = db.batch();
    for (const id of fileIds) {
        const fileRef = db.collection(FILES_COLLECTION).doc(id);
        const fileDoc = await fileRef.get();
        if (fileDoc.exists) {
            const fileData = fileDoc.data() as FileItem;
            if (fileData.storagePath) {
                const storageFileRef = getAdminStorage().bucket().file(fileData.storagePath);
                await storageFileRef.delete().catch(error => {
                   if (error.code !== 404) {
                        console.error(`Failed to delete file from storage: ${fileData.storagePath}`, error);
                    }
                });
            }
            batch.delete(fileRef);
        }
    }
    await batch.commit();
}

export async function getFileDownloadUrl(storagePath: string): Promise<string> {
    const bucket = getAdminStorage().bucket();
    const file = bucket.file(storagePath);
    
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    
    return url;
}

export async function getFileContent(storagePath: string): Promise<string> {
    const bucket = getAdminStorage().bucket();
    const file = bucket.file(storagePath);
    
    const [contents] = await file.download();
    return contents.toString('utf-8');
}


// --- Special Function for Saving Emails ---
export async function saveEmailForContact(userId: string, contactName: string, emailContent: { subject: string; body: string; }) {
    checkDb();
    const filesRoot = await getFolders(userId);
    let contactRootFolder = filesRoot.find(f => f.name === "Client Documents" && !f.parentId);
    if (!contactRootFolder) {
        contactRootFolder = await addFolder({ name: "Client Documents", userId, parentId: null });
    }
    
    let contactFolder = filesRoot.find(f => f.name === contactName && f.parentId === contactRootFolder!.id);
    if (!contactFolder) {
        contactFolder = await addFolder({ name: contactName, userId, parentId: contactRootFolder.id });
    }

    const fileName = `${emailContent.subject.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString()}.html`;
    const fileContent = `<html><body><h1>${emailContent.subject}</h1><div>${emailContent.body}</div></body></html>`;
    const buffer = Buffer.from(fileContent, 'utf-8');
    const storagePath = `${userId}/${contactFolder.id}/${Date.now()}-${fileName}`;
    const bucket = getAdminStorage().bucket();
    await bucket.file(storagePath).save(buffer, { contentType: 'text/html' });

    const fileData: Omit<FileItem, 'id'> = {
        name: fileName,
        type: 'text/html',
        size: buffer.length,
        modifiedAt: new Date(),
        folderId: contactFolder.id,
        userId,
        storagePath,
    };
    
    await addFileRecord(fileData);
}

export async function addFileFromDataUrl(data: {
    dataUrl: string;
    fileName: string;
    userId: string;
    folderId: string;
}): Promise<FileItem> {
    const { dataUrl, fileName, userId, folderId } = data;
    
    const mimeTypeMatch = dataUrl.match(/^data:(.*);base64,/);
    if (!mimeTypeMatch) {
        throw new Error("Invalid data URL format.");
    }
    const mimeType = mimeTypeMatch[1];
    const base64Data = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const bucket = getAdminStorage().bucket();
    const storagePath = `${userId}/${folderId}/${Date.now()}-${fileName}`;
    
    await bucket.file(storagePath).save(buffer, { contentType: mimeType });

    const fileData: Omit<FileItem, 'id'> = {
        name: fileName,
        type: mimeType,
        size: buffer.length,
        modifiedAt: new Date(),
        folderId: folderId,
        userId: userId,
        storagePath: storagePath,
    };
    
    return addFileRecord(fileData);
}

export async function saveChatArchive(userId: string, fileName: string, chatContent: string): Promise<void> {
    checkDb();
    // 1. Find or create the "Chat Archives" folder
    const archiveFolder = await findOrCreateFileFolder(userId, "Chat Archives", null);

    // 2. Prepare content and upload to storage
    const finalFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    const buffer = Buffer.from(chatContent, 'utf-8');
    const storagePath = `${userId}/${archiveFolder.id}/${Date.now()}-${finalFileName}`;
    const bucket = getAdminStorage().bucket();
    await bucket.file(storagePath).save(buffer, { contentType: 'text/plain' });

    // 3. Create the file record in Firestore
    const fileData: Omit<FileItem, 'id'> = {
        name: finalFileName,
        type: 'text/plain',
        size: buffer.length,
        modifiedAt: new Date(),
        folderId: archiveFolder.id,
        userId,
        storagePath,
    };
    
    await addFileRecord(fileData);
}
