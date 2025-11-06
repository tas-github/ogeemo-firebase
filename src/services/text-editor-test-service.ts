
'use client';

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getBytes } from 'firebase/storage';
import { initializeFirebase } from '@/lib/firebase';

export interface TestFile {
    id: string;
    name: string;
    folderId: string;
    userId: string;
    storagePath: string;
    createdAt: Date;
    modifiedAt: Date;
}

const TEST_FILES_COLLECTION = 'testFiles';

async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

async function getAppStorage() {
    const { storage } = await initializeFirebase();
    return storage;
}

const docToTestFile = (doc: any): TestFile => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        modifiedAt: (data.modifiedAt as Timestamp)?.toDate() || new Date(),
    } as TestFile;
}

export async function getTestFiles(userId: string, folderId: string): Promise<TestFile[]> {
    const db = await getDb();
    const q = query(
        collection(db, TEST_FILES_COLLECTION), 
        where("userId", "==", userId),
        where("folderId", "==", folderId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToTestFile);
}

export async function getTestFileContent(storagePath: string): Promise<string> {
    const storage = await getAppStorage();
    const contentRef = storageRef(storage, storagePath);
    const bytes = await getBytes(contentRef);
    return new TextDecoder('utf-8').decode(bytes);
}

export async function saveTestFile(
    userId: string, 
    folderId: string, 
    fileName: string, 
    content: string,
    fileIdToUpdate: string | null
): Promise<TestFile> {
    const db = await getDb();
    const storage = await getAppStorage();

    if (fileIdToUpdate) {
        // Update existing file
        const docRef = doc(db, TEST_FILES_COLLECTION, fileIdToUpdate);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error("File to update not found.");
        }
        const existingData = docToTestFile(docSnap);

        const contentBlob = new Blob([content], { type: 'text/html' });
        const fileRef = storageRef(storage, existingData.storagePath);
        await uploadBytes(fileRef, contentBlob);
        
        const updatedData = {
            name: fileName,
            folderId: folderId,
            modifiedAt: new Date(),
        };
        await updateDoc(docRef, updatedData);
        return { ...existingData, ...updatedData };
    } else {
        // Create new file
        const storagePath = `testFiles/${userId}/${folderId}/${Date.now()}-${fileName}`;
        const contentBlob = new Blob([content], { type: 'text/html' });
        const fileRef = storageRef(storage, storagePath);
        await uploadBytes(fileRef, contentBlob);

        const newFileData = {
            name: fileName,
            folderId,
            userId,
            storagePath,
            createdAt: new Date(),
            modifiedAt: new Date(),
        };

        const docRef = await addDoc(collection(db, TEST_FILES_COLLECTION), newFileData);
        return { id: docRef.id, ...newFileData };
    }
}
