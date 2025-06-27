
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
export async function getFolders(): Promise<FolderData[]> {
  checkDb();
  const foldersCol = collection(db, FOLDERS_COLLECTION);
  const snapshot = await getDocs(foldersCol);
  return snapshot.docs.map(docToFolder);
}

export async function addFolder(folderName: string): Promise<FolderData> {
  checkDb();
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), { name: folderName });
  return { id: docRef.id, name: folderName };
}

// Contact functions
export async function getContacts(): Promise<Contact[]> {
  checkDb();
  const contactsCol = collection(db, CONTACTS_COLLECTION);
  const snapshot = await getDocs(contactsCol);
  return snapshot.docs.map(docToContact);
}

export async function addContact(contactData: Omit<Contact, 'id'>): Promise<Contact> {
  checkDb();
  const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), contactData);
  return { id: docRef.id, ...contactData };
}

export async function updateContact(contactId: string, contactData: Partial<Omit<Contact, 'id'>>): Promise<void> {
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
