
'use server';

import { adminDb as db, getAdminStorage } from '@/lib/firebase-admin';
import {
  type DocumentData,
  type QueryDocumentSnapshot,
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
export async function getFilesForFolder(userId: string, folderId: string): Promise<FileItem[]> {
    checkDb();
    const q = db.collection(FILES_COLLECTION).where("userId", "==", userId).where("folderId", "==", folderId);
    const snapshot = await q.get();
    return snapshot.docs.map(docToFile);
}

export async function addFile(formData: FormData): Promise<FileItem> {
    checkDb();
    
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const folderId = formData.get('folderId') as string | null;

    if (!file || !userId || !folderId) {
        throw new Error("Missing required file data for upload.");
    }

    const storagePath = `${userId}/${folderId}/${Date.now()}-${file.name}`;
    const bucket = getAdminStorage().bucket();
    const buffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(storagePath).save(buffer, {
        contentType: file.type,
    });

    const fileData: Omit<FileItem, 'id'> = {
        name: file.name,
        type: file.type,
        size: file.size,
        modifiedAt: new Date(file.lastModified),
        folderId,
        userId,
        storagePath,
    };
    const docRef = await db.collection(FILES_COLLECTION).add(fileData);
    return { id: docRef.id, ...fileData };
}

export async function updateFile(fileId: string, data: Partial<Omit<FileItem, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    await db.collection(FILES_COLLECTION).doc(fileId).update({ ...data, modifiedAt: new Date() });
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
    const file = new File([fileContent], fileName, { type: 'text/html' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('folderId', contactFolder.id);

    await addFile(formData);
}
