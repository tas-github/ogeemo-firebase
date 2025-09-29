
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
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeFirebase } from '@/lib/firebase';
import type { FileItem, FolderItem } from '@/data/files';

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

export async function addFolder(folderData: Omit<FolderItem, 'id' | 'createdAt'>): Promise<FolderItem> {
  const db = await getDb();
  const dataToSave = {
    ...folderData,
    parentId: folderData.parentId || null,
    createdAt: new Date(),
  };
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), dataToSave);
  return { id: docRef.id, ...dataToSave };
}

export async function updateFolder(folderId: string, folderData: Partial<Omit<FolderItem, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    await updateDoc(folderRef, folderData);
}

export async function deleteFolders(userId: string, folderIds: string[]): Promise<void> {
    const db = await getDb();
    const batch = writeBatch(db);
    
    folderIds.forEach(id => {
        const folderRef = doc(db, FOLDERS_COLLECTION, id);
        batch.delete(folderRef);
    });

    await batch.commit();
}

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
    return fileSnap.exists() ? docToFile(fileSnap) : null;
}

export async function addTextFile(folderId: string, fileName: string, content: string): Promise<FileItem> {
    const { auth } = await initializeFirebase();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated.");
    
    // The storagePath can be determined just before the first upload.
    // The record is created, and content can be added/saved later.
    const newFileRecordData: Omit<FileItem, 'id'> = {
        name: fileName,
        type: 'text/plain',
        size: 0,
        modifiedAt: new Date(),
        folderId,
        userId,
        storagePath: '', // Will be set on first save/upload of content
    };

    return addFileRecord(newFileRecordData);
}

export async function updateTextFileContentByPath(storagePath: string, content: string): Promise<void> {
    const storage = await getAppStorage();
    const fileRef = storageRef(storage, storagePath);
    const fileBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    await uploadBytes(fileRef, fileBlob);
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

export async function addDriveLinkFile(linkData: { userId: string, folderId: string, name: string, driveLink: string }): Promise<FileItem> {
    const db = await getDb();
    const newFileRecord: Omit<FileItem, 'id'> = {
        name: linkData.name,
        type: 'google-drive-link',
        size: 0,
        modifiedAt: new Date(),
        folderId: linkData.folderId,
        userId: linkData.userId,
        storagePath: linkData.driveLink, // Store the link in storagePath for consistency
        driveLink: linkData.driveLink,
    };
    return addFileRecord(newFileRecord);
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


export async function updateFile(fileId: string, data: Partial<Omit<FileItem, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const fileRef = doc(db, FILES_COLLECTION, fileId);
    await updateDoc(fileRef, data);
}

export async function addFileFromDataUrl(options: { dataUrl: string; fileName: string; userId: string; folderId: string }): Promise<FileItem> {
    const { dataUrl, fileName, userId, folderId } = options;

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    const storage = await getAppStorage();
    
    let finalFolderId = folderId;
    if (folderId === SITE_IMAGES_FOLDER_ID) {
        const siteImagesFolder = await findOrCreateFileFolder(userId, SITE_IMAGES_FOLDER_NAME, null, SITE_IMAGES_FOLDER_ID);
        finalFolderId = siteImagesFolder.id;
    }

    const storagePath = `${userId}/${finalFolderId}/${Date.now()}-${fileName}`;
    const fileRef = storageRef(storage, storagePath);

    await uploadBytes(fileRef, blob, { contentType: blob.type });

    const newFileRecord: Omit<FileItem, 'id'> = {
        name: fileName,
        type: blob.type,
        size: blob.size,
        modifiedAt: new Date(),
        folderId: finalFolderId,
        userId,
        storagePath,
    };
    
    return addFileRecord(newFileRecord);
}

export async function deleteFiles(fileIds: string[]): Promise<void> {
    if (fileIds.length === 0) return;
    const db = await getDb();
    const storage = await getAppStorage();
    const batch = writeBatch(db);

    const fileDocsPromises = fileIds.map(id => getDoc(doc(db, FILES_COLLECTION, id)));
    const fileDocs = await Promise.all(fileDocsPromises);

    for (const fileDoc of fileDocs) {
        if (fileDoc.exists()) {
            const fileData = fileDoc.data() as Omit<FileItem, 'id'>;
            
            if (fileData.storagePath && !fileData.driveLink) { // Only delete from storage if it's not just a drive link
                const fileRef = storageRef(storage, fileData.storagePath);
                try {
                    await deleteObject(fileRef);
                } catch (error: any) {
                    if (error.code !== 'storage/object-not-found') {
                        console.error(`Failed to delete file from storage at path ${fileData.storagePath}:`, error);
                        throw new Error(`Failed to delete file from storage: ${error.message}`);
                    }
                }
            }
            
            batch.delete(fileDoc.ref);
        }
    }

    await batch.commit();
}


export async function saveEmailForContact(userId: string, contactName: string, email: { subject: string; body: string }): Promise<void> {
    const db = await getDb();
    const storage = await getAppStorage();

    const contactsRootFolder = await findOrCreateFileFolder(userId, "Contacts");
    
    const contactFolder = await findOrCreateFileFolder(userId, contactName, contactsRootFolder.id);

    const timestamp = new Date().toISOString();
    const fileName = `${email.subject.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.html`;
    const fileContent = `
        <html>
            <head>
                <title>${email.subject}</title>
                <style>body { font-family: sans-serif; }</style>
            </head>
            <body>
                <h1>${email.subject}</h1>
                <p>Saved on: ${new Date().toLocaleString()}</p>
                <hr>
                <div>${email.body}</div>
            </body>
        </html>
    `;
    const fileBlob = new Blob([fileContent], { type: 'text/html' });

    const storagePath = `${userId}/${contactFolder.id}/${fileName}`;
    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, fileBlob);

    const newFileRecord: Omit<FileItem, 'id'> = {
        name: fileName,
        type: 'text/html',
        size: fileBlob.size,
        modifiedAt: new Date(),
        folderId: contactFolder.id,
        userId,
        storagePath,
    };

    await addFileRecord(newFileRecord);
}

export async function archiveIdeaAsFile(userId: string, title: string, content: string): Promise<void> {
    const db = await getDb();
    const storage = await getAppStorage();

    const archiveFolder = await findOrCreateFileFolder(userId, "Archived Ideas");
    
    const finalFileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    const fileContent = `# ${title}\n\n${content.replace(/<[^>]+>/g, '\n')}`; // Basic HTML to Markdown
    const fileBlob = new Blob([fileContent], { type: 'text/markdown' });

    const storagePath = `${userId}/${archiveFolder.id}/${Date.now()}-${finalFileName}`;
    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, fileBlob);
    
    const newFileRecord: Omit<FileItem, 'id'> = {
        name: finalFileName,
        type: 'text/markdown',
        size: fileBlob.size,
        modifiedAt: new Date(),
        folderId: archiveFolder.id,
        userId,
        storagePath,
    };

    await addFileRecord(newFileRecord);
}
