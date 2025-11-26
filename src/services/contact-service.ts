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
    Timestamp 
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import type { Contact } from '@/data/contacts';

const CONTACTS_COLLECTION = 'contacts';
const CLIENT_ACCOUNTS_COLLECTION = 'clientAccounts';

interface ClientAccount {
  id: string;
  name: string;
  contactId: string;
  userId: string;
  createdAt: Date;
}

// --- Helper Functions ---
async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

const docToContact = (doc: any): Contact => ({ id: doc.id, ...doc.data() } as Contact);


// --- Client Account Function (New) ---
async function createClientAccount(userId: string, contactId: string, contactName: string): Promise<void> {
    const db = await getDb();
    const q = query(collection(db, CLIENT_ACCOUNTS_COLLECTION), where("contactId", "==", contactId), where("userId", "==", userId));
    const existingAccount = await getDocs(q);

    if (existingAccount.empty) {
      const accountData = {
          name: contactName,
          contactId,
          userId,
          createdAt: new Date(),
      };
      await addDoc(collection(db, CLIENT_ACCOUNTS_COLLECTION), accountData);
    }
}


// --- Contact functions ---
export async function getContacts(userId: string): Promise<Contact[]> {
  const db = await getDb();
  const q = query(collection(db, CONTACTS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToContact);
}

export async function addContact(contactData: Omit<Contact, 'id'>): Promise<Contact> {
  const db = await getDb();
  // Explicitly handle the 'website' field to ensure it's included.
  const dataToSave = {
    ...contactData,
    website: contactData.website || '',
  };
  const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), dataToSave);
  
  await createClientAccount(contactData.userId, docRef.id, contactData.name);

  return { id: docRef.id, ...dataToSave };
}

export async function updateContact(contactId: string, contactData: Partial<Omit<Contact, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const contactRef = doc(db, CONTACTS_COLLECTION, contactId);
    // This now correctly passes the entire partial data object to Firestore for updating.
    await updateDoc(contactRef, contactData);
}


export async function deleteContacts(contactIds: string[]): Promise<void> {
    const db = await getDb();
    if (contactIds.length === 0) return;
    const batch = writeBatch(db);
    
    // Firestore 'in' query supports up to 30 elements. For more, chunking is needed.
    for (let i = 0; i < contactIds.length; i += 30) {
      const chunk = contactIds.slice(i, i + 30);
      const accountsQuery = query(collection(db, CLIENT_ACCOUNTS_COLLECTION), where('contactId', 'in', chunk));
      const accountsSnapshot = await getDocs(accountsQuery);
      accountsSnapshot.forEach(accountDoc => {
          batch.delete(accountDoc.ref);
      });
    }
    
    contactIds.forEach(id => {
        const contactRef = doc(db, CONTACTS_COLLECTION, id);
        batch.delete(contactRef);
    });

    await batch.commit();
}


// This function has been deprecated and its functionality moved to contact-folder-service.
// It is kept here to avoid breaking imports but should not be used.
export async function findOrCreateFolder(userId: string, folderName: string) {
    console.warn("findOrCreateFolder is deprecated. Use services from contact-folder-service instead.");
    // This function will now do nothing to prevent unintended side-effects.
    return { id: 'deprecated', name: folderName, userId, parentId: null, createdAt: new Date() };
}