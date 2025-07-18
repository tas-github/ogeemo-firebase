
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  writeBatch,
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
export interface InvoiceLineItem {
  id?: string; // Optional because it won't exist before being saved
  invoiceId: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  contactId: string;
  originalAmount: number;
  amountPaid: number;
  dueDate: Date;
  invoiceDate: Date;
  status: 'outstanding' | 'paid' | 'partially_paid' | 'overdue';
  notes: string;
  taxRate: number;
  taxType: string;
  userId: string;
  createdAt: Date;
}

const INVOICES_COLLECTION = 'invoices';
const LINE_ITEMS_COLLECTION = 'invoiceLineItems';

const docToInvoice = (doc: QueryDocumentSnapshot<DocumentData> | DocumentData): Invoice => {
    const data = doc.data();
    if (!data) throw new Error("Document data is missing.");
    return {
        id: doc.id,
        invoiceNumber: data.invoiceNumber,
        clientName: data.clientName,
        contactId: data.contactId,
        originalAmount: data.originalAmount,
        amountPaid: data.amountPaid,
        dueDate: (data.dueDate as Timestamp)?.toDate ? (data.dueDate as Timestamp).toDate() : new Date(),
        invoiceDate: (data.invoiceDate as Timestamp)?.toDate ? (data.invoiceDate as Timestamp).toDate() : new Date(),
        status: data.status,
        notes: data.notes,
        taxRate: data.taxRate,
        taxType: data.taxType,
        userId: data.userId,
        createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(),
    } as Invoice;
};

const docToLineItem = (doc: QueryDocumentSnapshot<DocumentData>): InvoiceLineItem => {
    const data = doc.data();
    return {
        id: doc.id,
        invoiceId: data.invoiceId,
        description: data.description,
        quantity: data.quantity,
        price: data.price,
    } as InvoiceLineItem;
};


export async function getInvoices(userId: string): Promise<Invoice[]> {
  if (!db) throw new Error("Firestore not initialized");
  const q = query(collection(db, INVOICES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToInvoice);
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docToInvoice(docSnap);
    }
    return null;
}

export async function getLineItemsForInvoice(invoiceId: string): Promise<InvoiceLineItem[]> {
    if (!db) throw new Error("Firestore not initialized");
    const q = query(collection(db, LINE_ITEMS_COLLECTION), where("invoiceId", "==", invoiceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToLineItem);
}


export async function addInvoiceWithLineItems(
    invoiceData: Omit<Invoice, 'id' | 'createdAt'>, 
    lineItems: Omit<InvoiceLineItem, 'invoiceId' | 'id'>[]
): Promise<Invoice> {
    if (!db) throw new Error("Firestore not initialized");
    const batch = writeBatch(db);

    const invoiceRef = doc(collection(db, INVOICES_COLLECTION));
    batch.set(invoiceRef, { ...invoiceData, createdAt: new Date() });

    lineItems.forEach(item => {
        const itemRef = doc(collection(db, LINE_ITEMS_COLLECTION));
        batch.set(itemRef, { ...item, invoiceId: invoiceRef.id });
    });

    await batch.commit();

    return { id: invoiceRef.id, ...invoiceData, createdAt: new Date() };
}

export async function updateInvoiceWithLineItems(
    invoiceId: string, 
    invoiceData: Partial<Omit<Invoice, 'id' | 'userId'>>, 
    lineItems: Omit<InvoiceLineItem, 'id' | 'invoiceId'>[]
): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    const batch = writeBatch(db);

    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    batch.update(invoiceRef, invoiceData);

    // First, delete all existing line items for this invoice
    const existingItemsQuery = query(collection(db, LINE_ITEMS_COLLECTION), where("invoiceId", "==", invoiceId));
    const existingItemsSnapshot = await getDocs(existingItemsQuery);
    existingItemsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // Then, add the new/updated line items
    lineItems.forEach(item => {
        const itemRef = doc(collection(db, LINE_ITEMS_COLLECTION));
        batch.set(itemRef, { ...item, invoiceId });
    });
    
    await batch.commit();
}


export async function deleteInvoice(invoiceId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    const batch = writeBatch(db);
    
    // Delete invoice
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    batch.delete(invoiceRef);

    // Delete associated line items
    const lineItemsQuery = query(collection(db, LINE_ITEMS_COLLECTION), where("invoiceId", "==", invoiceId));
    const lineItemsSnapshot = await getDocs(lineItemsQuery);
    lineItemsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
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

// --- Accounts Payable Interfaces & Functions ---
export interface PayableBill {
  id: string;
  vendor: string;
  invoiceNumber: string;
  dueDate: string;
  amount: number;
  category: string;
  description: string;
  userId: string;
}

const PAYABLES_COLLECTION = 'payableBills';
const docToPayableBill = (doc: QueryDocumentSnapshot<DocumentData>): PayableBill => ({ id: doc.id, ...doc.data() } as PayableBill);

export async function getPayableBills(userId: string): Promise<PayableBill[]> {
  if (!db) throw new Error("Firestore not initialized");
  const q = query(collection(db, PAYABLES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToPayableBill);
}

export async function addPayableBill(data: Omit<PayableBill, 'id'>): Promise<PayableBill> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, PAYABLES_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updatePayableBill(id: string, data: Partial<Omit<PayableBill, 'id' | 'userId'>>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, PAYABLES_COLLECTION, id), data);
}

export async function deletePayableBill(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, PAYABLES_COLLECTION, id));
}

// --- Asset Management Interfaces & Functions ---
export interface DepreciationEntry {
  id: string; // Could be a timestamp or a unique ID
  date: string;
  amount: number;
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  assetClass?: string;
  purchaseDate: string;
  cost: number;
  undepreciatedCapitalCost: number;
  depreciationEntries?: DepreciationEntry[];
  userId: string;
}

const ASSETS_COLLECTION = 'assets';
const docToAsset = (doc: QueryDocumentSnapshot<DocumentData>): Asset => ({ id: doc.id, ...doc.data(), depreciationEntries: doc.data().depreciationEntries || [] } as Asset);

export async function getAssets(userId: string): Promise<Asset[]> {
  if (!db) throw new Error("Firestore not initialized");
  const q = query(collection(db, ASSETS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToAsset);
}

export async function addAsset(data: Omit<Asset, 'id'>): Promise<Asset> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, ASSETS_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updateAsset(id: string, data: Partial<Omit<Asset, 'id' | 'userId'>>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, ASSETS_COLLECTION, id), data);
}

export async function deleteAsset(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, ASSETS_COLLECTION, id));
}
