
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

// --- Firestore Collection Names ---
const FILES_COLLECTION = 'textEditorFiles';

// --- Helper Functions ---
async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

const docToFile = (doc: any): EditorFile => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        modifiedAt: (data.modifiedAt as Timestamp)?.toDate() || new Date(),
    } as EditorFile
};


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
