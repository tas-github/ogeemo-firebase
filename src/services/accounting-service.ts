
'use client';

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { mockIncome, mockExpenses } from '@/data/accounting';
import { format } from 'date-fns';
import { t2125ExpenseCategories, t2125IncomeCategories } from '@/data/standard-expense-categories';


async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

// --- Base Interface ---
interface BaseTransaction {
  id: string;
  date: string;
  company: string;
  description: string;
  totalAmount: number;
  preTaxAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  explanation?: string;
  documentNumber?: string;
  documentUrl?: string;
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
  taxType?: string;
  taxRate?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyName: string;
  contactId: string;
  originalAmount: number;
  amountPaid: number;
  dueDate: Date;
  invoiceDate: Date;
  status: 'outstanding' | 'paid' | 'partially_paid' | 'overdue';
  notes: string;
  taxType: string;
  userId: string;
  createdAt: Date;
}

const INVOICES_COLLECTION = 'invoices';
const LINE_ITEMS_COLLECTION = 'invoiceLineItems';

const docToInvoice = (doc: any): Invoice => {
    const data = doc.data();
    if (!data) throw new Error("Document data is missing.");
    return {
        id: doc.id,
        invoiceNumber: data.invoiceNumber,
        companyName: data.companyName,
        contactId: data.contactId,
        originalAmount: data.originalAmount,
        amountPaid: data.amountPaid,
        dueDate: (data.dueDate as Timestamp)?.toDate ? (data.dueDate as Timestamp).toDate() : new Date(),
        invoiceDate: (data.invoiceDate as Timestamp)?.toDate ? (data.invoiceDate as Timestamp).toDate() : new Date(),
        status: data.status,
        notes: data.notes,
        taxType: data.taxType,
        userId: data.userId,
        createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(),
    } as Invoice;
};

const docToLineItem = (doc: any): InvoiceLineItem => {
    const data = doc.data();
    return {
        id: doc.id,
        invoiceId: data.invoiceId,
        description: data.description,
        quantity: data.quantity,
        price: data.price,
        taxType: data.taxType || '',
        taxRate: data.taxRate || 0,
    } as InvoiceLineItem;
};


export async function getInvoices(userId: string): Promise<Invoice[]> {
  const db = await getDb();
  const q = query(collection(db, INVOICES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToInvoice);
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const db = await getDb();
    const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docToInvoice(docSnap);
    }
    return null;
}

export async function getLineItemsForInvoice(invoiceId: string): Promise<InvoiceLineItem[]> {
    const db = await getDb();
    const q = query(collection(db, LINE_ITEMS_COLLECTION), where("invoiceId", "==", invoiceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToLineItem);
}


export async function addInvoiceWithLineItems(
    invoiceData: Omit<Invoice, 'id' | 'createdAt'>, 
    lineItems: Omit<InvoiceLineItem, 'invoiceId' | 'id'>[]
): Promise<Invoice> {
    const db = await getDb();
    const batch = writeBatch(db);

    // Sync company name
    const companiesRef = collection(db, 'companies');
    const companyQuery = query(companiesRef, where("userId", "==", invoiceData.userId), where("name", "==", invoiceData.companyName));
    const companySnapshot = await getDocs(companyQuery);
    if (companySnapshot.empty) {
        addDoc(companiesRef, { name: invoiceData.companyName, userId: invoiceData.userId });
    }

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
    const db = await getDb();
    const batch = writeBatch(db);

    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    batch.update(invoiceRef, invoiceData);

    const existingItemsQuery = query(collection(db, LINE_ITEMS_COLLECTION), where("invoiceId", "==", invoiceId));
    const existingItemsSnapshot = await getDocs(existingItemsQuery);
    existingItemsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    lineItems.forEach(item => {
        const itemRef = doc(collection(db, LINE_ITEMS_COLLECTION));
        batch.set(itemRef, { ...item, invoiceId });
    });
    
    await batch.commit();
}


export async function deleteInvoice(invoiceId: string): Promise<void> {
    const db = await getDb();
    const batch = writeBatch(db);
    
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    batch.delete(invoiceRef);

    const lineItemsQuery = query(collection(db, LINE_ITEMS_COLLECTION), where("invoiceId", "==", invoiceId));
    const lineItemsSnapshot = await getDocs(lineItemsQuery);
    lineItemsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
}

// --- Income Interfaces & Functions ---
export interface IncomeTransaction extends BaseTransaction {
  incomeCategory: string; // This will store the category NUMBER
  depositedTo: string;
}

const INCOME_COLLECTION = 'incomeTransactions';
const docToIncome = (doc: any): IncomeTransaction => ({ id: doc.id, ...doc.data() } as IncomeTransaction);

export async function getIncomeTransactions(userId: string): Promise<IncomeTransaction[]> {
    const db = await getDb();
    const q = query(collection(db, INCOME_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        const batch = writeBatch(db);
        const newEntries: IncomeTransaction[] = [];
        mockIncome.forEach(item => {
            const docRef = doc(collection(db, INCOME_COLLECTION));
            // Find the category number for the mock item
            const categoryObject = t2125IncomeCategories.find(c => c.description === item.incomeCategory);
            const transactionData = { ...item, userId, incomeCategory: categoryObject?.line || 'C-1' }; // Fallback to a custom ID
            batch.set(docRef, transactionData);
            newEntries.push({ ...transactionData, id: docRef.id });
        });
        await batch.commit();
        return newEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    return snapshot.docs.map(docToIncome).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addIncomeTransaction(data: Omit<IncomeTransaction, 'id'>): Promise<IncomeTransaction> {
    const db = await getDb();
    const docRef = await addDoc(collection(db, INCOME_COLLECTION), data);
    return { id: docRef.id, ...data };
}

export async function updateIncomeTransaction(id: string, data: Partial<Omit<IncomeTransaction, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    await updateDoc(doc(db, INCOME_COLLECTION, id), data);
}

export async function deleteIncomeTransaction(id: string): Promise<void> {
    const db = await getDb();
    await deleteDoc(doc(db, INCOME_COLLECTION, id));
}


// --- Expense Interfaces & Functions ---
export interface ExpenseTransaction extends BaseTransaction {
  category: string; // This will store the category NUMBER
}

const EXPENSE_COLLECTION = 'expenseTransactions';
const docToExpense = (doc: any): ExpenseTransaction => ({ id: doc.id, ...doc.data() } as ExpenseTransaction);

export async function getExpenseTransactions(userId: string): Promise<ExpenseTransaction[]> {
    const db = await getDb();
    const q = query(collection(db, EXPENSE_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        const batch = writeBatch(db);
        const newEntries: ExpenseTransaction[] = [];
        mockExpenses.forEach(item => {
            const docRef = doc(collection(db, EXPENSE_COLLECTION));
            const categoryObject = t2125ExpenseCategories.find(c => c.description === item.category);
            const transactionData = { ...item, userId, category: categoryObject?.line || 'C-1' };
            batch.set(docRef, transactionData);
            newEntries.push({ ...transactionData, id: docRef.id });
        });
        await batch.commit();
        return newEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    return snapshot.docs.map(docToExpense).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addExpenseTransaction(data: Omit<ExpenseTransaction, 'id'>): Promise<ExpenseTransaction> {
    const db = await getDb();
    const docRef = await addDoc(collection(db, EXPENSE_COLLECTION), data);
    return { id: docRef.id, ...data };
}

export async function updateExpenseTransaction(id: string, data: Partial<Omit<ExpenseTransaction, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    await updateDoc(doc(db, EXPENSE_COLLECTION, id), data);
}

export async function deleteExpenseTransaction(id: string): Promise<void> {
    const db = await getDb();
    await deleteDoc(doc(db, EXPENSE_COLLECTION, id));
}

// --- Accounts Payable Interfaces & Functions ---
export interface PayableBill {
  id: string;
  vendor: string;
  invoiceNumber: string;
  dueDate: string;
  totalAmount: number;
  preTaxAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  category: string;
  description: string;
  documentUrl?: string;
  userId: string;
}


const PAYABLES_COLLECTION = 'payableBills';
const docToPayableBill = (doc: any): PayableBill => {
    const data = doc.data();
    const totalAmount = data.totalAmount ?? 0;
    return { id: doc.id, ...data, totalAmount } as PayableBill;
};

export async function getPayableBills(userId: string): Promise<PayableBill[]> {
  const db = await getDb();
  const q = query(collection(db, PAYABLES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToPayableBill);
}

export async function addPayableBill(data: Omit<PayableBill, 'id'>): Promise<PayableBill> {
  const db = await getDb();
  const docRef = await addDoc(collection(db, PAYABLES_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updatePayableBill(id: string, data: Partial<Omit<PayableBill, 'id' | 'userId'>>): Promise<void> {
  const db = await getDb();
  await updateDoc(doc(db, PAYABLES_COLLECTION, id), data);
}

export async function deletePayableBill(id: string): Promise<void> {
  const db = await getDb();
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
  applyHalfYearRule: boolean;
  depreciationEntries?: DepreciationEntry[];
  userId: string;
}

const ASSETS_COLLECTION = 'assets';
const docToAsset = (doc: any): Asset => {
    const data = doc.data();
    return { 
        id: doc.id, 
        ...data, 
        applyHalfYearRule: data.applyHalfYearRule !== false, // Default to true if not present
        depreciationEntries: data.depreciationEntries || [] 
    } as Asset
};

export async function getAssets(userId: string): Promise<Asset[]> {
  const db = await getDb();
  const q = query(collection(db, ASSETS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToAsset);
}

export async function addAsset(data: Omit<Asset, 'id'>): Promise<Asset> {
  const db = await getDb();
  const docRef = await addDoc(collection(db, ASSETS_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updateAsset(id: string, data: Partial<Omit<Asset, 'id' | 'userId'>>): Promise<void> {
  const db = await getDb();
  await updateDoc(doc(db, ASSETS_COLLECTION, id), data);
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDb();
  await deleteDoc(doc(db, ASSETS_COLLECTION, id));
}


// --- Equity Interfaces & Functions ---
export interface EquityTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'contribution' | 'draw';
  userId: string;
}

const EQUITY_COLLECTION = 'equityTransactions';
const docToEquityTransaction = (doc: any): EquityTransaction => ({ id: doc.id, ...doc.data() } as EquityTransaction);

export async function getEquityTransactions(userId: string): Promise<EquityTransaction[]> {
    const db = await getDb();
    const q = query(collection(db, EQUITY_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToEquityTransaction);
}

export async function addEquityTransaction(data: Omit<EquityTransaction, 'id'>): Promise<EquityTransaction> {
    const db = await getDb();
    const docRef = await addDoc(collection(db, EQUITY_COLLECTION), data);
    return { id: docRef.id, ...data };
}

export async function updateEquityTransaction(id: string, data: Partial<Omit<EquityTransaction, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    await updateDoc(doc(db, EQUITY_COLLECTION, id), data);
}

export async function deleteEquityTransaction(id: string): Promise<void> {
    const db = await getDb();
    await deleteDoc(doc(db, EQUITY_COLLECTION, id));
}

// --- Company Interfaces & Functions ---
export interface Company {
  id: string;
  name: string;
  userId: string;
}

const COMPANIES_COLLECTION = 'companies';
const docToCompany = (doc: any): Company => ({ id: doc.id, ...doc.data() } as Company);

export async function getCompanies(userId: string): Promise<Company[]> {
  const db = await getDb();
  const q = query(collection(db, COMPANIES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToCompany);
}

export async function addCompany(data: Omit<Company, 'id'>): Promise<Company> {
  const db = await getDb();
  const docRef = await addDoc(collection(db, COMPANIES_COLLECTION), data);
  return { id: docRef.id, ...data };
}

// --- Expense Category Interfaces & Functions ---
export interface ExpenseCategory {
  id: string;
  name: string;
  userId: string;
  categoryNumber?: string;
  explanation?: string;
}

const EXPENSE_CATEGORIES_COLLECTION = 'expenseCategories';
const docToExpenseCategory = (doc: any): ExpenseCategory => ({ id: doc.id, ...doc.data() } as ExpenseCategory);

export async function getExpenseCategories(userId: string): Promise<ExpenseCategory[]> {
  const db = await getDb();
  const q = query(collection(db, EXPENSE_CATEGORIES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const existingCategories = snapshot.docs.map(docToExpenseCategory);
  const existingCategoryNames = new Set(existingCategories.map(c => c.name.toLowerCase().trim()));
  const batch = writeBatch(db);
  let hasWrites = false;

  for (const stdCat of t2125ExpenseCategories) {
    const stdNameLower = stdCat.description.toLowerCase().trim();
    if (!existingCategoryNames.has(stdNameLower)) {
      const docRef = doc(collection(db, EXPENSE_CATEGORIES_COLLECTION));
      batch.set(docRef, { name: stdCat.description, userId, categoryNumber: stdCat.line, explanation: stdCat.explanation });
      hasWrites = true;
    } else {
      const existingCat = existingCategories.find(c => c.name.toLowerCase().trim() === stdNameLower);
      if (existingCat && (existingCat.categoryNumber !== stdCat.line || existingCat.explanation !== stdCat.explanation)) {
        const docRef = doc(db, EXPENSE_CATEGORIES_COLLECTION, existingCat.id);
        batch.update(docRef, { categoryNumber: stdCat.line, explanation: stdCat.explanation });
        hasWrites = true;
      }
    }
  }

  if (hasWrites) {
    await batch.commit();
    const finalSnapshot = await getDocs(q); // Re-fetch to get updated data
    return finalSnapshot.docs.map(docToExpenseCategory).sort((a,b) => a.name.localeCompare(b.name));
  }

  return existingCategories.sort((a,b) => a.name.localeCompare(b.name));
}

export async function addExpenseCategory(data: Omit<ExpenseCategory, 'id'| 'categoryNumber'>): Promise<ExpenseCategory> {
  const db = await getDb();
  const allCategories = await getExpenseCategories(data.userId);
  const customCategories = allCategories.filter(c => c.categoryNumber && c.categoryNumber.startsWith('C-'));
  const highestCustomNum = customCategories.reduce((max, cat) => {
    const num = parseInt(cat.categoryNumber!.substring(2));
    return num > max ? num : max;
  }, 0);

  const newCategoryNumber = `C-${highestCustomNum + 1}`;
  const dataToSave = { ...data, categoryNumber: newCategoryNumber };
  
  const docRef = await addDoc(collection(db, EXPENSE_CATEGORIES_COLLECTION), dataToSave);
  return { id: docRef.id, ...dataToSave };
}

export async function updateExpenseCategory(id: string, data: Partial<Omit<ExpenseCategory, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    await updateDoc(doc(db, EXPENSE_CATEGORIES_COLLECTION, id), data);
}

export async function deleteExpenseCategory(id: string): Promise<void> {
    const db = await getDb();
    await deleteDoc(doc(db, EXPENSE_CATEGORIES_COLLECTION, id));
}

export async function deleteExpenseCategories(ids: string[]): Promise<void> {
    const db = await getDb();
    if (ids.length === 0) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
        batch.delete(doc(db, EXPENSE_CATEGORIES_COLLECTION, id));
    });
    await batch.commit();
}


// --- Income Category Interfaces & Functions ---
export interface IncomeCategory {
  id: string;
  name: string;
  userId: string;
  categoryNumber?: string;
  explanation?: string;
}

const INCOME_CATEGORIES_COLLECTION = 'incomeCategories';
const docToIncomeCategory = (doc: any): IncomeCategory => ({ id: doc.id, ...doc.data() } as IncomeCategory);

export async function getIncomeCategories(userId: string): Promise<IncomeCategory[]> {
  const db = await getDb();
  const q = query(collection(db, INCOME_CATEGORIES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const existingCategories = snapshot.docs.map(docToIncomeCategory);
  const existingCategoryNames = new Set(existingCategories.map(c => c.name.toLowerCase().trim()));
  const batch = writeBatch(db);
  let hasWrites = false;

  for (const stdCat of t2125IncomeCategories) {
      const stdNameLower = stdCat.description.toLowerCase().trim();
      if (!existingCategoryNames.has(stdNameLower)) {
          const docRef = doc(collection(db, INCOME_CATEGORIES_COLLECTION));
          batch.set(docRef, { name: stdCat.description, userId, categoryNumber: stdCat.line, explanation: stdCat.explanation });
          hasWrites = true;
      } else {
          const existingCat = existingCategories.find(c => c.name.toLowerCase().trim() === stdNameLower);
          if (existingCat && (existingCat.categoryNumber !== stdCat.line || existingCat.explanation !== stdCat.explanation)) {
              const docRef = doc(db, INCOME_CATEGORIES_COLLECTION, existingCat.id);
              batch.update(docRef, { categoryNumber: stdCat.line, explanation: stdCat.explanation });
              hasWrites = true;
          }
      }
  }

  if (hasWrites) {
    await batch.commit();
    const finalSnapshot = await getDocs(q);
    return finalSnapshot.docs.map(docToIncomeCategory).sort((a,b) => a.name.localeCompare(b.name));
  }
  
  return existingCategories.sort((a,b) => a.name.localeCompare(b.name));
}

export async function addIncomeCategory(data: Omit<IncomeCategory, 'id' | 'categoryNumber'>): Promise<IncomeCategory> {
  const db = await getDb();
  const allCategories = await getIncomeCategories(data.userId);
  const customCategories = allCategories.filter(c => c.categoryNumber && c.categoryNumber.startsWith('C-'));
  const highestCustomNum = customCategories.reduce((max, cat) => {
    const num = parseInt(cat.categoryNumber!.substring(2));
    return num > max ? num : max;
  }, 0);

  const newCategoryNumber = `C-${highestCustomNum + 1}`;
  const dataToSave = { ...data, categoryNumber: newCategoryNumber };

  const docRef = await addDoc(collection(db, INCOME_CATEGORIES_COLLECTION), dataToSave);
  return { id: docRef.id, ...dataToSave };
}

export async function updateIncomeCategory(id: string, data: Partial<Omit<IncomeCategory, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    await updateDoc(doc(db, INCOME_CATEGORIES_COLLECTION, id), data);
}

export async function deleteIncomeCategory(id: string): Promise<void> {
    const db = await getDb();
    await deleteDoc(doc(db, INCOME_CATEGORIES_COLLECTION, id));
}

export async function deleteIncomeCategories(ids: string[]): Promise<void> {
    const db = await getDb();
    if (ids.length === 0) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
        batch.delete(doc(db, INCOME_CATEGORIES_COLLECTION, id));
    });
    await batch.commit();
}

// --- Service Item Interfaces & Functions ---
export interface ServiceItem {
  id: string;
  description: string;
  price: number;
  taxType?: string;
  taxRate?: number;
  userId: string;
}

const SERVICE_ITEMS_COLLECTION = 'serviceItems';
const docToServiceItem = (doc: any): ServiceItem => ({ id: doc.id, ...doc.data() } as ServiceItem);

export async function getServiceItems(userId: string): Promise<ServiceItem[]> {
  const db = await getDb();
  const q = query(collection(db, SERVICE_ITEMS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToServiceItem);
}

export async function addServiceItem(data: Omit<ServiceItem, 'id'>): Promise<ServiceItem> {
  const db = await getDb();
  const docRef = await addDoc(collection(db, SERVICE_ITEMS_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updateServiceItem(id: string, data: Partial<Omit<ServiceItem, 'id' | 'userId'>>): Promise<void> {
  const db = await getDb();
  await updateDoc(doc(db, SERVICE_ITEMS_COLLECTION, id), data);
}

export async function deleteServiceItem(id: string): Promise<void> {
  const db = await getDb();
  await deleteDoc(doc(db, SERVICE_ITEMS_COLLECTION, id));
}
