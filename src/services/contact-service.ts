
'use server';

import { db } from '@/lib/firebase';
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
import type { Contact, FolderData } from '@/data/contacts';

const FOLDERS_COLLECTION = 'contactFolders';
const CONTACTS_COLLECTION = 'contacts';
const CLIENT_ACCOUNTS_COLLECTION = 'clientAccounts'; // New collection for client accounts

interface ClientAccount {
  id: string;
  name: string;
  contactId: string;
  userId: string;
  createdAt: Date;
}

function checkDb() {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

// Helper to convert Firestore doc to our type
const docToFolder = (doc: QueryDocumentSnapshot<DocumentData>): FolderData => ({ id: doc.id, ...doc.data() } as FolderData);
const docToContact = (doc: QueryDocumentSnapshot<DocumentData>): Contact => ({ id: doc.id, ...doc.data() } as Contact);

// --- Client Account Function (New) ---
async function createClientAccount(userId: string, contactId: string, contactName: string): Promise<void> {
    checkDb();
    const accountData = {
        name: contactName,
        contactId,
        userId,
        createdAt: new Date(),
    };
    await addDoc(collection(db, CLIENT_ACCOUNTS_COLLECTION), accountData);
}


// --- Folder functions ---
export async function getFolders(userId: string): Promise<FolderData[]> {
  checkDb();
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFolder);
}

export async function addFolder(folderData: Omit<FolderData, 'id'>): Promise<FolderData> {
  checkDb();
  const dataToSave = {
    ...folderData,
    parentId: folderData.parentId || null,
  };
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), dataToSave);
  return { id: docRef.id, ...dataToSave };
}

export async function updateFolder(folderId: string, folderData: Partial<Omit<FolderData, 'id' | 'userId'>>): Promise<void> {
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

    // Delete all contacts within these folders
    if (folderIdsToDelete.size > 0) {
        const contactsQuery = query(collection(db, CONTACTS_COLLECTION), where('folderId', 'in', Array.from(folderIdsToDelete)));
        const contactsSnapshot = await getDocs(contactsQuery);
        contactsSnapshot.forEach(contactDoc => {
            batch.delete(contactDoc.ref);
        });
    }

    // Delete all the folders
    folderIdsToDelete.forEach(id => {
        const folderRef = doc(db, FOLDERS_COLLECTION, id);
        batch.delete(folderRef);
    });

    await batch.commit();
}


// --- Contact functions ---
export async function getContacts(userId: string): Promise<Contact[]> {
  checkDb();
  const q = query(collection(db, CONTACTS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToContact);
}

export async function addContact(contactData: Omit<Contact, 'id'>): Promise<Contact> {
  checkDb();
  const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), contactData);
  
  // Automatically create a client account when a new contact is added
  await createClientAccount(contactData.userId, docRef.id, contactData.name);

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
    
    // Also delete associated client accounts
    const accountsQuery = query(collection(db, CLIENT_ACCOUNTS_COLLECTION), where('contactId', 'in', contactIds));
    const accountsSnapshot = await getDocs(accountsQuery);
    accountsSnapshot.forEach(accountDoc => {
        batch.delete(accountDoc.ref);
    });
    
    // Delete contacts
    contactIds.forEach(id => {
        const contactRef = doc(db, CONTACTS_COLLECTION, id);
        batch.delete(contactRef);
    });

    await batch.commit();
}
