
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

// --- Base Interface ---
interface BaseTransaction {
  id: string;
  date: string;
  company: string;
  description: string;
  amount: number;
  explanation?: string;
  documentNumber?: string;
  type: 'business' | 'personal';
  userId: string;
}

// --- Invoice Interfaces & Functions ---
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

export async function getInvoices(userId: string): Promise<Invoice[]> {
  if (!db) throw new Error("Firestore not initialized");
  const q = query(collection(db, INVOICES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToInvoice);
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, INVOICES_COLLECTION), invoiceData);
  return { id: docRef.id, ...invoiceData };
}

export async function updateInvoice(invoiceId: string, invoiceData: Partial<Omit<Invoice, 'id' | 'userId'>>): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    await updateDoc(invoiceRef, invoiceData);
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    await deleteDoc(invoiceRef);
}

// --- Income Interfaces & Functions ---
export interface IncomeTransaction extends BaseTransaction {
  incomeType: string;
  depositedTo: string;
}

const INCOME_COLLECTION = 'incomeTransactions';
const docToIncome = (doc: QueryDocumentSnapshot<DocumentData>): IncomeTransaction => ({ id: doc.id, ...doc.data() } as IncomeTransaction);

export async function getIncomeTransactions(userId: string): Promise<IncomeTransaction[]> {
    if (!db) throw new Error("Firestore not initialized");
    const q = query(collection(db, INCOME_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToIncome);
}

export async function addIncomeTransaction(data: Omit<IncomeTransaction, 'id'>): Promise<IncomeTransaction> {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, INCOME_COLLECTION), data);
    return { id: docRef.id, ...data };
}

export async function updateIncomeTransaction(id: string, data: Partial<Omit<IncomeTransaction, 'id' | 'userId'>>): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    await updateDoc(doc(db, INCOME_COLLECTION, id), data);
}

export async function deleteIncomeTransaction(id: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, INCOME_COLLECTION, id));
}


// --- Expense Interfaces & Functions ---
export interface ExpenseTransaction extends BaseTransaction {
  category: string;
}

const EXPENSE_COLLECTION = 'expenseTransactions';
const docToExpense = (doc: QueryDocumentSnapshot<DocumentData>): ExpenseTransaction => ({ id: doc.id, ...doc.data() } as ExpenseTransaction);

export async function getExpenseTransactions(userId: string): Promise<ExpenseTransaction[]> {
    if (!db) throw new Error("Firestore not initialized");
    const q = query(collection(db, EXPENSE_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToExpense);
}

export async function addExpenseTransaction(data: Omit<ExpenseTransaction, 'id'>): Promise<ExpenseTransaction> {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, EXPENSE_COLLECTION), data);
    return { id: docRef.id, ...data };
}

export async function updateExpenseTransaction(id: string, data: Partial<Omit<ExpenseTransaction, 'id' | 'userId'>>): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    await updateDoc(doc(db, EXPENSE_COLLECTION, id), data);
}

export async function deleteExpenseTransaction(id: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, EXPENSE_COLLECTION, id));
}
