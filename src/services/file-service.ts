'use client';

import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    writeBatch,
    Timestamp,
    getDoc,
    setDoc,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, deleteObject, getBytes } from 'firebase/storage';
import { initializeFirebase } from '@/lib/firebase';
import type { FileItem, FolderItem } from '@/data/files';
import { onAuthStateChanged, type Auth } from 'firebase/auth';


const FOLDERS_COLLECTION = 'fileFolders';
const FILES_COLLECTION = 'files';
const SITE_IMAGES_FOLDER_NAME = 'Site Images';
export const SITE_IMAGES_FOLDER_ID = 'folder-site-images';

async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}
async function getAppStorage() {
    const { storage } = await initializeFirebase();
    return storage;
}

const docToFolder = (doc: any): FolderItem => ({ 
    id: doc.id, 
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
} as FolderItem);

const docToFile = (doc: any): FileItem => ({ 
    id: doc.id, 
    ...doc.data(),
    modifiedAt: (doc.data().modifiedAt as Timestamp)?.toDate() || new Date(),
} as FileItem);

export async function getFolders(userId: string): Promise<FolderItem[]> {
  const db = await getDb();
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFolder);
}

export async function findOrCreateFileFolder(userId: string, folderName: string, parentId: string | null = null, predefinedId?: string): Promise<FolderItem> {
    const db = await getDb();
    
    if (predefinedId) {
        const docRef = doc(db, FOLDERS_COLLECTION, predefinedId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docToFolder(docSnap);
        }
    }

    const q = query(
        collection(db, FOLDERS_COLLECTION), 
        where("userId", "==", userId), 
        where("name", "==", folderName),
        where("parentId", "==", parentId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return docToFolder(snapshot.docs[0]);
    } else {
        const newFolderData = {
            name: folderName,
            userId,
            parentId,
            createdAt: new Date(),
        };
        const docRef = predefinedId ? doc(db, FOLDERS_COLLECTION, predefinedId) : doc(collection(db, FOLDERS_COLLECTION));
        await setDoc(docRef, newFolderData);
        return { id: docRef.id, ...newFolderData };
    }
}

export async function addFolder(folderData: Omit<FolderItem, 'id'>): Promise<FolderItem> {
  const db = await getDb();
  const dataToSave = {
    ...folderData,
    parentId: folderData.parentId || null,
  };
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), dataToSave);
  return { id: docRef.id, ...dataToSave };
}

export async function updateFolder(folderId: string, folderData: Partial<Omit<FolderItem, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    await updateDoc(folderRef, folderData);
}

export async function deleteFoldersAndContents(userId: string, folderIds: string[]): Promise<void> {
    const db = await getDb();
    const storage = await getAppStorage();
    const batch = writeBatch(db);
    const allFolders = await getFolders(userId);
    const allFiles = await getFiles(userId);
    
    const foldersToDelete = new Set<string>(folderIds);
    
    const findDescendants = (parentId: string) => {
        allFolders
            .filter(f => f.parentId === parentId)
            .forEach(child => {
                foldersToDelete.add(child.id);
                findDescendants(child.id);
            });
    };
    
    folderIds.forEach(id => findDescendants(id));

    const filesToDelete = allFiles.filter(file => file.folderId && foldersToDelete.has(file.folderId));

    for (const file of filesToDelete) {
        if (file.storagePath && file.type !== 'google-drive-link') {
            try {
                const storageFileRef = storageRef(storage, file.storagePath);
                await deleteObject(storageFileRef);
            } catch (error: any) {
                if (error.code !== 'storage/object-not-found') {
                    console.error(`Failed to delete storage object for file \'\'\'${file.id}\'\'\'':`, error);
                }
            }
        }
        batch.delete(doc(db, FILES_COLLECTION, file.id));
    }

    foldersToDelete.forEach(id => {
        const folderRef = doc(db, FOLDERS_COLLECTION, id);
        batch.delete(folderRef);
    });

    await batch.commit();
}


// --- File functions ---
export async function getFiles(userId?: string): Promise<FileItem[]> {
  const db = await getDb();
  const q = userId ? query(collection(db, FILES_COLLECTION), where("userId", "==", userId)) : collection(db, FILES_COLLECTION);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFile);
}

export async function getFileById(fileId: string): Promise<FileItem | null> {
    const db = await getDb();
    const fileRef = doc(db, FILES_COLLECTION, fileId);
    const fileSnap = await getDoc(fileRef);
    if (!fileSnap.exists()) {
        return null;
    }
    return docToFile(fileSnap);
}

export async function getFileContentFromStorage(auth: Auth, storagePath: string): Promise<string> {
    if (!storagePath) {
        console.warn("Storage path is empty, returning empty content.");
        return '';
    }

    // Wait for the user to be authenticated before proceeding.
    await new Promise<void>((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Unsubscribe immediately to avoid memory leaks
            if (user) {
                resolve();
            } else {
                // If there's no user, wait a very short moment in case auth state is still initializing
                setTimeout(() => {
                    if (auth.currentUser) {
                        resolve();
                    } else {
                        reject(new Error("User is not authenticated."));
                    }
                }, 50);
            }
        });
    });

    try {
        const storage = await getAppStorage();
        const contentRef = storageRef(storage, storagePath);
        const bytes = await getBytes(contentRef);
        const textDecoder = new TextDecoder('utf-8');
        return textDecoder.decode(bytes);
    } catch (error: any) {
        console.error(`Failed to fetch content from ${storagePath}:`, error);
        throw new Error(`Failed to retrieve file content: ${error.message}`);
    }
}

export async function getFilesForFolder(userId: string, folderId: string): Promise<FileItem[]> {
  const db = await getDb();
  const q = query(collection(db, FILES_COLLECTION), where("userId", "==", userId), where("folderId", "==", folderId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFile);
}

export async function addFileRecord(fileData: Omit<FileItem, 'id'>): Promise<FileItem> {
    const db = await getDb();
    const docRef = await addDoc(collection(db, FILES_COLLECTION), fileData);
    return { id: docRef.id, ...fileData };
}

export async function addFile(formData: FormData): Promise<FileItem> {
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    let folderId = formData.get('folderId') as string;

    if (!file || !userId || folderId === null || folderId === undefined) {
        throw new Error("Missing required data for file upload.");
    }
    
    if (folderId === 'unfiled') {
        folderId = '';
    }

    const storage = await getAppStorage();
    const storagePath = `userFiles/${userId}/${folderId || 'unfiled'}/${Date.now()}-${file.name}`;
    const fileRef = storageRef(storage, storagePath);
    
    await uploadBytes(fileRef, file);

    const newFileRecord: Omit<FileItem, 'id'> = {
        name: file.name,
        type: file.type,
        size: file.size,
        modifiedAt: new Date(),
        folderId,
        userId,
        storagePath,
    };

    return addFileRecord(newFileRecord);
}

export async function updateFile(fileId: string, data: Partial<Omit<FileItem, 'id' | 'userId' | 'content'>> & { content?: string }): Promise<void> {
    const db = await getDb();
    const fileRef = doc(db, FILES_COLLECTION, fileId);

    const fileSnap = await getDoc(fileRef);
    if (!fileSnap.exists()) throw new Error("File not found to update.");
    const existingFileData = docToFile(fileSnap);

    const metadataToUpdate: {[key: string]: any} = { ...data };

    // If content is being updated, upload it to storage first.
    if (typeof data.content === 'string') {
        const storage = await getAppStorage();
        const fileBlob = new Blob([data.content], { type: existingFileData.type || 'text/plain;charset=utf-8' });
        const storageFileRef = storageRef(storage, existingFileData.storagePath);
        await uploadBytes(storageFileRef, fileBlob);
        metadataToUpdate.size = fileBlob.size; // Update the size in the metadata
    }

    // Ensure content is never written to Firestore
    delete metadataToUpdate.content; 
    metadataToUpdate.modifiedAt = new Date();
    
    if (Object.keys(metadataToUpdate).length > 0) {
      await updateDoc(fileRef, metadataToUpdate);
    }
}


export async function addTextFileClient(userId: string, folderId: string, fileName: string, content: string = ''): Promise<FileItem> {
    const storage = await getAppStorage();
    const fileBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });

    const storagePath = `userFiles/${userId}/${folderId || 'unfiled'}/${Date.now()}-${fileName}`;
    const fileRef = storageRef(storage, storagePath);

    await uploadBytes(fileRef, fileBlob);

    const newFileRecord: Omit<FileItem, 'id'> = {
        name: fileName,
        type: 'text/plain',
        size: fileBlob.size,
        modifiedAt: new Date(),
        folderId: folderId,
        userId,
        storagePath,
    };

    return addFileRecord(newFileRecord);
}


export async function saveEmailForContact(userId: string, contactName: string, email: { to: string, from: string, subject: string; body: string; sourceLink?: string; }): Promise<void> {
    console.log("--- Placeholder: saveEmailForContact ---");
    console.log("User ID:", userId);
    console.log("Contact Name:", contactName);
    console.log("Email to save:", email);
    console.log("This function will eventually save this email as an HTML file in the contact's folder in the File Manager.");
    console.log("--- End Placeholder ---");
    // This is a placeholder. The real implementation will be done in Phase 2.
    // No actual file saving will happen here.
    return Promise.resolve();
}

export async function addFileFromDataUrl(
    { dataUrl, fileName, userId, folderId }: { dataUrl: string; fileName: string; userId: string; folderId: string; }
): Promise<FileItem> {
    const storage = await getAppStorage();
    
    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const storagePath = `userFiles/${userId}/${folderId}/${Date.now()}-${fileName}`;
    const fileRef = storageRef(storage, storagePath);

    await uploadBytes(fileRef, blob);

    const newFileRecord: Omit<FileItem, 'id'> = {
        name: fileName,
        type: blob.type,
        size: blob.size,
        modifiedAt: new Date(),
        folderId,
        userId,
        storagePath,
    };

    return addFileRecord(newFileRecord);
}

// Kept for specific file deletions, but folder deletion is handled by deleteFolders
export async function deleteFiles(fileIds: string[]): Promise<void> {
    const db = await getDb();
    const storage = await getAppStorage();
    const batch = writeBatch(db);

    for (const fileId of fileIds) {
        const fileRef = doc(db, FILES_COLLECTION, fileId);
        const fileSnap = await getDoc(fileRef);
        if (fileSnap.exists()) {
            const fileData = docToFile(fileSnap);
            if (fileData.storagePath && fileData.type !== 'google-drive-link') {
                 try {
                    const storageFileRef = storageRef(storage, fileData.storagePath);
                    await deleteObject(storageFileRef);
                } catch (error: any) {
                    if (error.code !== 'storage/object-not-found') {
                        console.error(`Failed to delete file from storage: ${fileData.storagePath}`, error);
                        // Do not throw, allow Firestore deletion to proceed.
                    }
                }
            }
            batch.delete(fileRef);
        }
    }
    
    await batch.commit();
}
