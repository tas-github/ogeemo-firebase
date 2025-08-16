
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

// --- Helper Functions ---
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


// --- Folder functions ---
export async function getFolders(userId: string): Promise<FolderItem[]> {
  const db = await getDb();
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFolder);
}

export async function findOrCreateFileFolder(userId: string, folderName: string, parentId: string | null = null): Promise<FolderItem> {
    const db = await getDb();
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
        const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), newFolderData);
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

// --- File functions ---
export async function getFiles(userId: string): Promise<FileItem[]> {
  const db = await getDb();
  const q = query(collection(db, FILES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFile);
}

export async function getFileContent(storagePath: string): Promise<string> {
    const { storage } = await initializeFirebase();
    const fileRef = storageRef(storage, storagePath);
    const downloadUrl = await getDownloadURL(fileRef);

    // Fetch the content from the URL
    const response = await fetch(downloadUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }
    return await response.text();
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
    const storagePath = `${userId}/${folderId || 'unfiled'}/${Date.now()}-${file.name}`;
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

export async function addFileFromDataUrl(options: { dataUrl: string; fileName: string; userId: string; folderId: string }): Promise<void> {
    const { dataUrl, fileName, userId, folderId } = options;

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    const storage = await getAppStorage();
    const storagePath = `${userId}/${folderId}/${Date.now()}-${fileName}`;
    const fileRef = storageRef(storage, storagePath);

    await uploadBytes(fileRef, blob, { contentType: blob.type });

    const newFileRecord: Omit<FileItem, 'id'> = {
        name: fileName,
        type: blob.type,
        size: blob.size,
        modifiedAt: new Date(),
        folderId,
        userId,
        storagePath,
    };
    
    await addFileRecord(newFileRecord);
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
            
            // Delete from Storage if a path exists
            if (fileData.storagePath) {
                const fileRef = storageRef(storage, fileData.storagePath);
                try {
                    await deleteObject(fileRef);
                } catch (error: any) {
                    // If the object doesn't exist, we can ignore the error and proceed with DB deletion.
                    if (error.code !== 'storage/object-not-found') {
                        console.error(`Failed to delete file from storage at path ${fileData.storagePath}:`, error);
                        throw new Error(`Failed to delete file from storage: ${error.message}`);
                    }
                }
            }
            
            // Delete from Firestore
            batch.delete(fileDoc.ref);
        }
    }

    await batch.commit();
}


// A special function to save text content (like an email) as a file in a contact's subfolder
export async function saveEmailForContact(userId: string, contactName: string, email: { subject: string; body: string }): Promise<void> {
    const db = await getDb();
    const storage = await getAppStorage();

    // 1. Find or create the main "Contacts" folder
    const contactsRootFolder = await findOrCreateFileFolder(userId, "Contacts");
    
    // 2. Find or create the subfolder for this specific contact
    const contactFolder = await findOrCreateFileFolder(userId, contactName, contactsRootFolder.id);

    // 3. Create the file content
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

    // 4. Upload to Firebase Storage
    const storagePath = `${userId}/${contactFolder.id}/${fileName}`;
    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, fileBlob);

    // 5. Create Firestore record
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

// Function to save a chat archive
export async function saveChatArchive(userId: string, fileName: string, content: string): Promise<void> {
    const db = await getDb();
    const storage = await getAppStorage();

    const chatArchiveFolder = await findOrCreateFileFolder(userId, "Chat Archives");

    const finalFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    const fileBlob = new Blob([content], { type: 'text/plain' });

    const storagePath = `${userId}/${chatArchiveFolder.id}/${Date.now()}-${finalFileName}`;
    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, fileBlob);
    
    const newFileRecord: Omit<FileItem, 'id'> = {
        name: finalFileName,
        type: 'text/plain',
        size: fileBlob.size,
        modifiedAt: new Date(),
        folderId: chatArchiveFolder.id,
        userId,
        storagePath,
    };

    await addFileRecord(newFileRecord);
}
