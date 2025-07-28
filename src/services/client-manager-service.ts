
'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

// --- Interfaces ---
export interface ClientAccount {
  id: string;
  name: string;
  contactId: string;
  userId: string;
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


function checkDb() {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

// Helper to convert Firestore doc to our types
const docToClientAccount = (doc: QueryDocumentSnapshot<DocumentData>): ClientAccount => ({ id: doc.id, ...doc.data() } as ClientAccount);
const docToEventEntry = (doc: QueryDocumentSnapshot<DocumentData>): EventEntry => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
    } as EventEntry;
};


// --- Client Account Functions ---
export async function getClientAccounts(userId: string): Promise<ClientAccount[]> {
  checkDb();
  const q = db.collection(CLIENT_ACCOUNTS_COLLECTION).where("userId", "==", userId);
  const snapshot = await q.get();
  return snapshot.docs.map(docToClientAccount);
}

// Note: Client accounts are now created automatically when a contact is added via contact-service.
// A manual add function can be added here if needed.

// --- Event Entry Functions ---
export async function getEventEntries(userId: string): Promise<EventEntry[]> {
  checkDb();
  const q = db.collection(EVENT_ENTRIES_COLLECTION).where("userId", "==", userId);
  const snapshot = await q.get();
  return snapshot.docs.map(docToEventEntry).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
}

export async function addEventEntry(entryData: Omit<EventEntry, 'id'>): Promise<EventEntry> {
  checkDb();
  const docRef = await db.collection(EVENT_ENTRIES_COLLECTION).add(entryData);
  return { id: docRef.id, ...entryData };
}

export async function updateEventEntry(entryId: string, entryData: Partial<Omit<EventEntry, 'id' | 'userId' | 'accountId'>>): Promise<void> {
    checkDb();
    const entryRef = db.collection(EVENT_ENTRIES_COLLECTION).doc(entryId);
    await entryRef.update(entryData);
}

export async function deleteEventEntry(entryId: string): Promise<void> {
    checkDb();
    const entryRef = db.collection(EVENT_ENTRIES_COLLECTION).doc(entryId);
    await entryRef.delete();
}
