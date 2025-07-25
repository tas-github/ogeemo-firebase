
'use server';

import { db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject,
} from 'firebase/storage';
import { type FileItem, type FolderItem } from '@/data/files';

const FOLDERS_COLLECTION = 'fileFolders';
const FILES_COLLECTION = 'files';

function checkServices() {
    if (!db) throw new Error("Firestore is not initialized.");
    if (!storage) throw new Error("Firebase Storage is not initialized.");
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
    checkServices();
    const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToFolder);
}

export async function addFolder(folderData: Omit<FolderItem, 'id'>): Promise<FolderItem> {
    checkServices();
    const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), { ...folderData, parentId: folderData.parentId || null });
    return { id: docRef.id, ...folderData };
}

export async function updateFolder(folderId: string, folderData: Partial<Omit<FolderItem, 'id' | 'userId'>>): Promise<void> {
    checkServices();
    await updateDoc(doc(db, FOLDERS_COLLECTION, folderId), folderData);
}

export async function deleteFolderAndContents(userId: string, folderId: string): Promise<void> {
    checkServices();
    const batch = writeBatch(db);
    const allFoldersSnapshot = await getDocs(query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId)));
    const allFolders = allFoldersSnapshot.docs.map(docToFolder);
    
    const folderIdsToDelete = new Set<string>([folderId]);
    const findDescendants = (parentId: string) => {
        allFolders.filter(f => f.parentId === parentId).forEach(child => {
            folderIdsToDelete.add(child.id);
            findDescendants(child.id);
        });
    };
    findDescendants(folderId);

    const filesQuery = query(collection(db, FILES_COLLECTION), where('folderId', 'in', Array.from(folderIdsToDelete)));
    const filesSnapshot = await getDocs(filesQuery);
    
    for (const fileDoc of filesSnapshot.docs) {
        const fileData = fileDoc.data() as FileItem;
        if (fileData.storagePath) {
            const fileRef = ref(storage, fileData.storagePath);
            await deleteObject(fileRef);
        }
        batch.delete(fileDoc.ref);
    }

    folderIdsToDelete.forEach(id => {
        batch.delete(doc(db, FOLDERS_COLLECTION, id));
    });

    await batch.commit();
}

// --- File Functions ---
export async function getFilesForFolder(userId: string, folderId: string): Promise<FileItem[]> {
    checkServices();
    const q = query(collection(db, FILES_COLLECTION), where("userId", "==", userId), where("folderId", "==", folderId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToFile);
}

export async function addFile(formData: FormData): Promise<FileItem> {
    checkServices();
    
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const folderId = formData.get('folderId') as string | null;

    if (!file || !userId || !folderId) {
        throw new Error("Missing required file data for upload.");
    }

    const storagePath = `${userId}/${folderId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);

    const fileData: Omit<FileItem, 'id'> = {
        name: file.name,
        type: file.type,
        size: file.size,
        modifiedAt: new Date(file.lastModified),
        folderId,
        userId,
        storagePath,
    };
    const docRef = await addDoc(collection(db, FILES_COLLECTION), fileData);
    return { id: docRef.id, ...fileData };
}

export async function updateFile(fileId: string, data: Partial<Omit<FileItem, 'id' | 'userId'>>): Promise<void> {
    checkServices();
    await updateDoc(doc(db, FILES_COLLECTION, fileId), { ...data, modifiedAt: serverTimestamp() });
}

export async function deleteFiles(fileIds: string[]): Promise<void> {
    checkServices();
    const batch = writeBatch(db);
    for (const id of fileIds) {
        const fileRef = doc(db, FILES_COLLECTION, id);
        const fileDoc = await getDoc(fileRef);
        if (fileDoc.exists()) {
            const fileData = fileDoc.data() as FileItem;
            if (fileData.storagePath) {
                const storageRef = ref(storage, fileData.storagePath);
                await deleteObject(storageRef);
            }
            batch.delete(fileRef);
        }
    }
    await batch.commit();
}

export async function downloadFile(storagePath: string, fileName: string): Promise<void> {
    // This is a server-side function, so we trigger a client-side download
    // by sending back the URL. For direct server-to-server, we would stream the bytes.
    // To solve this in a Next.js app, we create an API route.
    const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath, fileName }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download file.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

// --- Special Function for Saving Emails ---
export async function saveEmailForContact(userId: string, contactName: string, emailContent: { subject: string; body: string; }) {
    checkServices();
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
