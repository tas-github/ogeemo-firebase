
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  originalAmount: number;
  amountPaid: number;
  dueDate: Date;
  status: 'paid' | 'partially_paid' | 'overdue' | 'outstanding';
  userId: string;
  createdAt: Date;
}

const INVOICES_COLLECTION = 'invoices';

function checkDb() {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

// Helper to convert Firestore doc to our Invoice type
const docToInvoice = (doc: QueryDocumentSnapshot<DocumentData>): Invoice => {
    const data = doc.data();
    return {
        id: doc.id,
        invoiceNumber: data.invoiceNumber,
        clientName: data.clientName,
        originalAmount: data.originalAmount,
        amountPaid: data.amountPaid,
        dueDate: (data.dueDate as Timestamp)?.toDate ? (data.dueDate as Timestamp).toDate() : new Date(data.dueDate),
        status: data.status,
        userId: data.userId,
        createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(),
    } as Invoice;
};


// --- Invoice Functions ---
export async function getInvoices(userId: string): Promise<Invoice[]> {
  checkDb();
  const q = query(collection(db, INVOICES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToInvoice);
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
  checkDb();
  const docRef = await addDoc(collection(db, INVOICES_COLLECTION), invoiceData);
  return { id: docRef.id, ...invoiceData };
}

export async function updateInvoice(invoiceId: string, invoiceData: Partial<Omit<Invoice, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    await updateDoc(invoiceRef, invoiceData);
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
    checkDb();
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    await deleteDoc(invoiceRef);
}

// TODO: Implement functions for income and expense transactions
// export async function getIncomeTransactions(userId: string) {}
// export async function addIncomeTransaction(data: any) {}
// export async function getExpenseTransactions(userId: string) {}
// export async function addExpenseTransaction(data: any) {}
