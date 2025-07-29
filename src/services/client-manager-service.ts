
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
    Timestamp 
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

// --- Interfaces ---
export interface ClientAccount {
  id: string;
  name: string;
  contactId: string;
  userId: string;
  createdAt: Date;
}

export interface EventEntry {
  id: string;
  accountId: string;
  contactName: string;
  subject: string;
  detailsHtml?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  billableRate: number;
  userId: string;
}

const CLIENT_ACCOUNTS_COLLECTION = 'clientAccounts';
const EVENT_ENTRIES_COLLECTION = 'eventEntries';

async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

// Helper to convert Firestore doc to our types
const docToClientAccount = (doc: any): ClientAccount => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(),
    } as ClientAccount;
};
const docToEventEntry = (doc: any): EventEntry => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        startTime: (data.startTime as Timestamp)?.toDate ? (data.startTime as Timestamp).toDate() : new Date(),
        endTime: (data.endTime as Timestamp)?.toDate ? (data.endTime as Timestamp).toDate() : new Date(),
    } as EventEntry;
};


// --- Client Account Functions ---
export async function getClientAccounts(userId: string): Promise<ClientAccount[]> {
  const db = await getDb();
  const q = query(collection(db, CLIENT_ACCOUNTS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToClientAccount);
}

// Note: Client accounts are now created automatically when a contact is added via contact-service.
// A manual add function can be added here if needed.

// --- Event Entry Functions ---
export async function getEventEntries(userId: string): Promise<EventEntry[]> {
  const db = await getDb();
  const q = query(collection(db, EVENT_ENTRIES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEventEntry).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
}

export async function addEventEntry(entryData: Omit<EventEntry, 'id'>): Promise<EventEntry> {
  const db = await getDb();
  const docRef = await addDoc(collection(db, EVENT_ENTRIES_COLLECTION), entryData);
  return { id: docRef.id, ...entryData };
}

export async function updateEventEntry(entryId: string, entryData: Partial<Omit<EventEntry, 'id' | 'userId' | 'accountId'>>): Promise<void> {
    const db = await getDb();
    const entryRef = doc(db, EVENT_ENTRIES_COLLECTION, entryId);
    await updateDoc(entryRef, entryData);
}

export async function deleteEventEntry(entryId: string): Promise<void> {
    const db = await getDb();
    const entryRef = doc(db, EVENT_ENTRIES_COLLECTION, entryId);
    await deleteDoc(entryRef);
}
