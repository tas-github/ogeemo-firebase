
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
    serverTimestamp
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

// --- Types ---
export interface EditorFile {
  id: string;
  name: string;
  content: string;
  folderId: string;
  userId: string;
  driveLink?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface EditorFolder {
  id: string;
  name: string;
  userId: string;
  parentId?: string | null;
}

// --- Firestore Collection Names ---
const FOLDERS_COLLECTION = 'textEditorFolders';
const FILES_COLLECTION = 'textEditorFiles';

// --- Helper Functions ---
async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

const docToFolder = (doc: any): EditorFolder => ({ id: doc.id, ...doc.data() } as EditorFolder);
const docToFile = (doc: any): EditorFile => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        modifiedAt: (data.modifiedAt as Timestamp)?.toDate() || new Date(),
    } as EditorFile
};


// --- Folder Functions ---

export async function getEditorFolders(userId: string): Promise<EditorFolder[]> {
  const db = await getDb();
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFolder);
}

export async function addEditorFolder(folderData: Omit<EditorFolder, 'id'>): Promise<EditorFolder> {
  const db = await getDb();
  const dataToSave = {
    ...folderData,
    parentId: folderData.parentId || null,
  };
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), dataToSave);
  return { id: docRef.id, ...dataToSave };
}

export async function updateEditorFolder(folderId: string, folderData: Partial<Omit<EditorFolder, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    await updateDoc(folderRef, folderData);
}

export async function deleteEditorFolder(folderId: string, userId: string): Promise<void> {
    const db = await getDb();
    const batch = writeBatch(db);
    
    // Get all folders to determine the hierarchy for deletion
    const allFolders = await getEditorFolders(userId);
    const foldersToDelete = new Set<string>([folderId]);

    function findDescendants(parentId: string) {
        allFolders
            .filter(f => f.parentId === parentId)
            .forEach(child => {
                foldersToDelete.add(child.id);
                findDescendants(child.id); // Recurse
            });
    }

    findDescendants(folderId);

    // Delete all files within the identified folders
    const folderIdsArray = Array.from(foldersToDelete);
    for (let i = 0; i < folderIdsArray.length; i += 10) { // Firestore 'in' query limit is 10
        const chunk = folderIdsArray.slice(i, i + 10);
        const filesQuery = query(collection(db, FILES_COLLECTION), where('folderId', 'in', chunk));
        const filesSnapshot = await getDocs(filesQuery);
        filesSnapshot.forEach(fileDoc => {
            batch.delete(fileDoc.ref);
        });
    }

    // Delete all the folders
    foldersToDelete.forEach(id => {
        const folderRef = doc(db, FOLDERS_COLLECTION, id);
        batch.delete(folderRef);
    });

    await batch.commit();
}


// --- File Functions ---

export async function getEditorFiles(userId: string): Promise<EditorFile[]> {
  const db = await getDb();
  const q = query(collection(db, FILES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFile);
}

export async function getEditorFile(fileId: string): Promise<EditorFile | null> {
    const db = await getDb();
    const docRef = doc(db, FILES_COLLECTION, fileId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docToFile(docSnap);
    }
    return null;
}

export async function addEditorFile(fileData: Omit<EditorFile, 'id' | 'createdAt' | 'modifiedAt'>): Promise<EditorFile> {
  const db = await getDb();
  const dataWithTimestamps = {
      ...fileData,
      createdAt: serverTimestamp(),
      modifiedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, FILES_COLLECTION), dataWithTimestamps);
  // We return a client-side representation with current dates, as serverTimestamp is just a token.
  // The next fetch will get the actual server-set time.
  return { id: docRef.id, ...fileData, createdAt: new Date(), modifiedAt: new Date() };
}

export async function updateEditorFile(fileId: string, data: Partial<Omit<EditorFile, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const db = await getDb();
    const fileRef = doc(db, FILES_COLLECTION, fileId);
    const dataWithTimestamp = {
        ...data,
        modifiedAt: serverTimestamp()
    };
    await updateDoc(fileRef, dataWithTimestamp);
}

export async function deleteEditorFile(fileId: string): Promise<void> {
    const db = await getDb();
    await deleteDoc(doc(db, FILES_COLLECTION, fileId));
}

export async function deleteEditorFiles(fileIds: string[]): Promise<void> {
    const db = await getDb();
    if (fileIds.length === 0) return;
    const batch = writeBatch(db);
    fileIds.forEach(id => {
        const docRef = doc(db, FILES_COLLECTION, id);
        batch.delete(docRef);
    });
    await batch.commit();
}
