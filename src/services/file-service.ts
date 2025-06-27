
'use server';

import { db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { FileItem, FolderItem } from '@/data/files';

const FOLDERS_COLLECTION = 'fileFolders';
const FILES_COLLECTION = 'files';

function checkDb() {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

function checkStorage() {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized. Please check your Firebase configuration.");
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

export async function getFolders(userId: string): Promise<FolderItem[]> {
  checkDb();
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
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

export async function deleteFolderAndContents(userId: string, folderId: string): Promise<void> {
    checkDb();
    const batch = writeBatch(db!);
    const allFoldersSnapshot = await getDocs(query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId)));
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
        for (const fileDoc of filesSnapshot.docs) {
            const fileData = docToFile(fileDoc);
            if (fileData.storagePath) {
                const fileStorageRef = ref(storage, fileData.storagePath);
                await deleteObject(fileStorageRef);
            }
            batch.delete(fileDoc.ref);
        }
    }

    // Delete all the folders
    folderIdsToDelete.forEach(id => {
        const folderRef = doc(db, FOLDERS_COLLECTION, id);
        batch.delete(folderRef);
    });

    await batch.commit();
}


// --- File Functions ---

export async function getFiles(userId: string): Promise<FileItem[]> {
  checkDb();
  const q = query(collection(db, FILES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFile);
}

async function _addFileDoc(fileData: Omit<FileItem, 'id'>): Promise<FileItem> {
  checkDb();
  const docRef = await addDoc(collection(db, FILES_COLLECTION), fileData);
  return { id: docRef.id, ...fileData };
}

export async function uploadFiles(userId: string, folderId: string, files: File[]): Promise<FileItem[]> {
  checkDb();
  checkStorage();

  const uploadedFileItems: FileItem[] = [];

  for (const file of files) {
    const storagePath = `uploads/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);

    const fileData: Omit<FileItem, 'id'> = {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        modifiedAt: new Date(),
        folderId: folderId,
        userId: userId,
        storagePath: storagePath,
    };
    
    const newFileItem = await _addFileDoc(fileData);
    uploadedFileItems.push(newFileItem);
  }

  return uploadedFileItems;
}

export async function getFileDownloadUrl(storagePath: string): Promise<string> {
    checkStorage();
    const storageRef = ref(storage, storagePath);
    return await getDownloadURL(storageRef);
}

export async function updateFile(fileId: string, fileData: Partial<Omit<FileItem, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const fileRef = doc(db, FILES_COLLECTION, fileId);
    await updateDoc(fileRef, fileData);
}

export async function deleteFiles(files: FileItem[]): Promise<void> {
    checkDb();
    checkStorage();
    if (files.length === 0) return;

    const batch = writeBatch(db);

    for (const file of files) {
        // Delete from Storage
        if(file.storagePath) {
            const fileRef = ref(storage, file.storagePath);
            await deleteObject(fileRef);
        }
        
        // Batch delete from Firestore
        const docRef = doc(db, FILES_COLLECTION, file.id);
        batch.delete(docRef);
    }
    
    await batch.commit();
}
