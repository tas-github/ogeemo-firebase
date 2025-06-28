
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
import type { Contact, FolderData } from '@/data/contacts';

const FOLDERS_COLLECTION = 'contactFolders';
const CONTACTS_COLLECTION = 'contacts';

function checkDb() {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

// Helper to convert Firestore doc to our type
const docToFolder = (doc: QueryDocumentSnapshot<DocumentData>): FolderData => ({ id: doc.id, ...doc.data() } as FolderData);
const docToContact = (doc: QueryDocumentSnapshot<DocumentData>): Contact => ({ id: doc.id, ...doc.data() } as Contact);

// Folder functions
export async function getFolders(userId: string): Promise<FolderData[]> {
  checkDb();
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFolder);
}

export async function addFolder(folderData: Omit<FolderData, 'id'>): Promise<FolderData> {
  checkDb();
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), folderData);
  return { id: docRef.id, ...folderData };
}

export async function updateFolder(folderId: string, folderData: Partial<Omit<FolderData, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    await updateDoc(folderRef, folderData);
}

export async function deleteFolder(folderId: string): Promise<void> {
    checkDb();
    const batch = writeBatch(db);

    // Delete folder itself
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    batch.delete(folderRef);

    // Query for contacts in that folder and delete them
    const contactsQuery = query(collection(db, CONTACTS_COLLECTION), where("folderId", "==", folderId));
    const contactsSnapshot = await getDocs(contactsQuery);
    contactsSnapshot.forEach(contactDoc => {
        batch.delete(contactDoc.ref);
    });

    await batch.commit();
}


// Contact functions
export async function getContacts(userId: string): Promise<Contact[]> {
  checkDb();
  const q = query(collection(db, CONTACTS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToContact);
}

export async function addContact(contactData: Omit<Contact, 'id'>): Promise<Contact> {
  checkDb();
  const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), contactData);
  return { id: docRef.id, ...contactData };
}

export async function updateContact(contactId: string, contactData: Partial<Omit<Contact, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const contactRef = doc(db, CONTACTS_COLLECTION, contactId);
    await updateDoc(contactRef, contactData);
}

export async function deleteContacts(contactIds: string[]): Promise<void> {
    checkDb();
    if (contactIds.length === 0) return;
    const batch = writeBatch(db);
    contactIds.forEach(id => {
        const contactRef = doc(db, CONTACTS_COLLECTION, id);
        batch.delete(contactRef);
    });
    await batch.commit();
}

    