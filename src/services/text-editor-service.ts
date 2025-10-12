
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
    writeBatch
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

// --- Types ---
export interface EditorFile {
  id: string;
  name: string;
  content: string;
  folderId: string;
  userId: string;
}

export interface EditorFolder {
  id: string;
  name: string;
  userId: string;
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
const docToFile = (doc: any): EditorFile => ({ id: doc.id, ...doc.data() } as EditorFile);


// --- Folder Functions ---

export async function getEditorFolders(userId: string): Promise<EditorFolder[]> {
  const db = await getDb();
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFolder);
}

export async function addEditorFolder(folderData: Omit<EditorFolder, 'id'>): Promise<EditorFolder> {
  const db = await getDb();
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), folderData);
  return { id: docRef.id, ...folderData };
}

export async function updateEditorFolder(folderId: string, folderData: Partial<Omit<EditorFolder, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    await updateDoc(folderRef, folderData);
}

export async function deleteEditorFolder(folderId: string): Promise<void> {
    const db = await getDb();
    const batch = writeBatch(db);

    // Delete the folder itself
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    batch.delete(folderRef);

    // Delete all files within that folder
    const filesQuery = query(collection(db, FILES_COLLECTION), where('folderId', '==', folderId));
    const filesSnapshot = await getDocs(filesQuery);
    filesSnapshot.forEach(fileDoc => {
        batch.delete(fileDoc.ref);
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

export async function addEditorFile(fileData: Omit<EditorFile, 'id'>): Promise<EditorFile> {
  const db = await getDb();
  const docRef = await addDoc(collection(db, FILES_COLLECTION), fileData);
  return { id: docRef.id, ...fileData };
}

export async function updateEditorFile(fileId: string, data: Partial<Omit<EditorFile, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const fileRef = doc(db, FILES_COLLECTION, fileId);
    await updateDoc(fileRef, data);
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
