
'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import type { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
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

// Helper to convert Firestore doc to our types
const docToFolder = (doc: QueryDocumentSnapshot<DocumentData>): FolderData => ({ id: doc.id, ...doc.data() } as FolderData);
const docToContact = (doc: QueryDocumentSnapshot<DocumentData>): Contact => ({ id: doc.id, ...doc.data() } as Contact);

// --- Client Account Function (New) ---
async function createClientAccount(userId: string, contactId: string, contactName: string): Promise<void> {
    checkDb();
    // Check if an account already exists for this contact
    const q = db.collection(CLIENT_ACCOUNTS_COLLECTION).where("contactId", "==", contactId).where("userId", "==", userId);
    const existingAccount = await q.get();

    if (existingAccount.empty) {
      const accountData = {
          name: contactName,
          contactId,
          userId,
          createdAt: new Date(),
      };
      await db.collection(CLIENT_ACCOUNTS_COLLECTION).add(accountData);
    }
}


// --- Folder functions ---
export async function getFolders(userId: string): Promise<FolderData[]> {
  checkDb();
  const q = db.collection(FOLDERS_COLLECTION).where("userId", "==", userId);
  const snapshot = await q.get();
  return snapshot.docs.map(docToFolder);
}

export async function addFolder(folderData: Omit<FolderData, 'id'>): Promise<FolderData> {
  checkDb();
  const dataToSave = {
    ...folderData,
    parentId: folderData.parentId || null,
  };
  const docRef = await db.collection(FOLDERS_COLLECTION).add(dataToSave);
  return { id: docRef.id, ...dataToSave };
}

export async function updateFolder(folderId: string, folderData: Partial<Omit<FolderData, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const folderRef = db.collection(FOLDERS_COLLECTION).doc(folderId);
    await folderRef.update(folderData);
}

export async function deleteFolderAndContents(userId: string, folderId: string): Promise<void> {
    checkDb();
    const batch = db.batch();
    const allFoldersSnapshot = await db.collection(FOLDERS_COLLECTION).where("userId", "==", userId).get();
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
        const contactsQuery = db.collection(CONTACTS_COLLECTION).where('folderId', 'in', Array.from(folderIdsToDelete));
        const contactsSnapshot = await contactsQuery.get();
        contactsSnapshot.forEach(contactDoc => {
            batch.delete(contactDoc.ref);
        });
    }

    // Delete all the folders
    folderIdsToDelete.forEach(id => {
        const folderRef = db.collection(FOLDERS_COLLECTION).doc(id);
        batch.delete(folderRef);
    });

    await batch.commit();
}


// --- Contact functions ---
export async function getContacts(userId: string): Promise<Contact[]> {
  checkDb();
  const q = db.collection(CONTACTS_COLLECTION).where("userId", "==", userId);
  const snapshot = await q.get();
  return snapshot.docs.map(docToContact);
}

export async function addContact(contactData: Omit<Contact, 'id'>): Promise<Contact> {
  checkDb();
  const docRef = await db.collection(CONTACTS_COLLECTION).add(contactData);
  
  // Automatically create a client account when a new contact is added
  await createClientAccount(contactData.userId, docRef.id, contactData.name);

  return { id: docRef.id, ...contactData };
}

export async function updateContact(contactId: string, contactData: Partial<Omit<Contact, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const contactRef = db.collection(CONTACTS_COLLECTION).doc(contactId);
    await contactRef.update(contactData);
}

export async function deleteContacts(contactIds: string[]): Promise<void> {
    checkDb();
    if (contactIds.length === 0) return;
    const batch = db.batch();
    
    // Also delete associated client accounts
    const accountsQuery = db.collection(CLIENT_ACCOUNTS_COLLECTION).where('contactId', 'in', contactIds);
    const accountsSnapshot = await accountsQuery.get();
    accountsSnapshot.forEach(accountDoc => {
        batch.delete(accountDoc.ref);
    });
    
    // Delete contacts
    contactIds.forEach(id => {
        const contactRef = db.collection(CONTACTS_COLLECTION).doc(id);
        batch.delete(contactRef);
    });

    await batch.commit();
}
