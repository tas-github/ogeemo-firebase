
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
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { type Employee, mockEmployees } from '@/data/payroll';

const EMPLOYEES_COLLECTION = 'payrollEmployees';

async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

const docToEmployee = (doc: any): Employee => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        hireDate: data.hireDate ? (data.hireDate as Timestamp).toDate() : null,
        startDate: data.startDate ? (data.startDate as Timestamp).toDate() : null,
    } as Employee;
};

export async function getEmployees(userId: string): Promise<Employee[]> {
    const db = await getDb();
    const q = query(collection(db, EMPLOYEES_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    // If the user has no employees, populate with mock data for demo purposes.
    if (snapshot.empty) {
        const batch = writeBatch(db);
        const newEmployees: Employee[] = [];
        mockEmployees.forEach(emp => {
            const docRef = doc(collection(db, EMPLOYEES_COLLECTION));
            batch.set(docRef, { ...emp, userId });
            newEmployees.push({ ...emp, id: docRef.id, userId });
        });
        await batch.commit();
        return newEmployees;
    }

    return snapshot.docs.map(docToEmployee);
}

export async function addEmployee(data: Omit<Employee, 'id'>): Promise<Employee> {
    const db = await getDb();
    const docRef = await addDoc(collection(db, EMPLOYEES_COLLECTION), data);
    return { id: docRef.id, ...data };
}

export async function updateEmployee(id: string, data: Partial<Omit<Employee, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    await updateDoc(doc(db, EMPLOYEES_COLLECTION, id), data);
}

export async function deleteEmployee(id: string): Promise<void> {
    const db = await getDb();
    await deleteDoc(doc(db, EMPLOYEES_COLLECTION, id));
}
