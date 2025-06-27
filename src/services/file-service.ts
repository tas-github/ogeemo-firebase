
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { FileItem, FolderItem } from '@/data/files';

const FOLDERS_COLLECTION = 'fileFolders';
const FILES_COLLECTION = 'files';

function checkDb() {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

// Helper to convert Firestore doc to our types, handling Timestamps
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

export async function getFolders(): Promise<FolderItem[]> {
  checkDb();
  const foldersCol = collection(db, FOLDERS_COLLECTION);
  const snapshot = await getDocs(foldersCol);
  return snapshot.docs.map(docToFolder);
}

export async function addFolder(folderData: Omit<FolderItem, 'id'>): Promise<FolderItem> {
  checkDb();
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), folderData);
  return { id: docRef.id, ...folderData };
}

export async function updateFolder(folderId: string, folderData: Partial<Omit<FolderItem, 'id'>>): Promise<void> {
    checkDb();
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    await updateDoc(folderRef, folderData);
}

export async function deleteFolderAndContents(folderId: string): Promise<void> {
    checkDb();
    const batch = writeBatch(db!);
    const allFoldersSnapshot = await getDocs(collection(db, FOLDERS_COLLECTION));
    const allFolders = allFoldersSnapshot.docs.map(docToFolder);
    
    const folderIdsToDelete = new Set<string>([folderId]);
    const findDescendants = (parentId: string) => {
        allFolders
            .filter(f => f.parentId === parentId)
            .forEach(child => {
                folderIdsToDelete.add(child.id);
                findDescendants(child.id);
            });
    };
    findDescendants(folderId);

    // Delete all files within these folders
    if (folderIdsToDelete.size > 0) {
        const filesQuery = query(collection(db, FILES_COLLECTION), where('folderId', 'in', Array.from(folderIdsToDelete)));
        const filesSnapshot = await getDocs(filesQuery);
        filesSnapshot.forEach(fileDoc => {
            batch.delete(fileDoc.ref);
        });
    }

    // Delete all the folders
    folderIdsToDelete.forEach(id => {
        const folderRef = doc(db, FOLDERS_COLLECTION, id);
        batch.delete(folderRef);
    });

    await batch.commit();
}


// --- File Functions ---

export async function getFiles(): Promise<FileItem[]> {
  checkDb();
  const filesCol = collection(db, FILES_COLLECTION);
  const snapshot = await getDocs(filesCol);
  return snapshot.docs.map(docToFile);
}

export async function addFile(fileData: Omit<FileItem, 'id'>): Promise<FileItem> {
  checkDb();
  // Firestore handles Date objects correctly, they become Timestamps.
  const docRef = await addDoc(collection(db, FILES_COLLECTION), fileData);
  return { id: docRef.id, ...fileData };
}

export async function updateFile(fileId: string, fileData: Partial<FileItem>): Promise<void> {
    checkDb();
    const fileRef = doc(db, FILES_COLLECTION, fileId);
    await updateDoc(fileRef, fileData);
}

export async function deleteFiles(fileIds: string[]): Promise<void> {
    checkDb();
    if (fileIds.length === 0) return;
    const batch = writeBatch(db);
    fileIds.forEach(id => {
        const fileRef = doc(db, FILES_COLLECTION, id);
        batch.delete(fileRef);
    });
    await batch.commit();
}
