
'use client';

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

export interface ToDoItem {
  id: string;
  text: string;
  userId: string;
  createdAt: Date;
}

const TODOS_COLLECTION = 'todos';

async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

const docToTodo = (doc: any): ToDoItem => {
    const data = doc.data();
    return {
        id: doc.id,
        text: data.text,
        userId: data.userId,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    } as ToDoItem;
};


export async function getTodos(userId: string): Promise<ToDoItem[]> {
    const db = await getDb();
    const q = query(
        collection(db, TODOS_COLLECTION), 
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docToTodo).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function addTodo(todoData: Omit<ToDoItem, 'id'>): Promise<ToDoItem> {
    const db = await getDb();
    const docRef = await addDoc(collection(db, TODOS_COLLECTION), todoData);
    return { id: docRef.id, ...todoData };
}

export async function updateTodo(todoId: string, newText: string): Promise<void> {
    const db = await getDb();
    const todoRef = doc(db, TODOS_COLLECTION, todoId);
    await updateDoc(todoRef, { text: newText });
}

export async function deleteTodo(todoId: string): Promise<void> {
    const db = await getDb();
    await deleteDoc(doc(db, TODOS_COLLECTION, todoId));
}
