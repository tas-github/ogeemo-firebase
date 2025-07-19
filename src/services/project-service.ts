
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { type Project } from '@/data/projects';
import type { Event } from '@/types/calendar';
import type { ProjectTemplate, PartialTask } from '@/data/project-templates';

const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'tasks';
const TEMPLATES_COLLECTION = 'projectTemplates';

function checkDb() {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

// Helper to convert Firestore doc to our types, handling Timestamps
const docToProject = (doc: QueryDocumentSnapshot<DocumentData>): Project => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(),
        dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : undefined,
    } as Project;
};
const docToTemplate = (doc: QueryDocumentSnapshot<DocumentData>): ProjectTemplate => ({ id: doc.id, ...doc.data() } as ProjectTemplate);
const docToEvent = (doc: QueryDocumentSnapshot<DocumentData>): Event => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        start: data.start?.toDate ? data.start.toDate() : new Date(),
        end: data.end?.toDate ? data.end.toDate() : new Date(),
    } as Event;
};

// --- Project Functions ---
export async function getProjects(userId: string): Promise<Project[]> {
  checkDb();
  const q = query(collection(db, PROJECTS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    // If there are no projects, create the default "Project List"
    const defaultProject: Omit<Project, 'id' | 'createdAt'> = {
      name: 'Project List',
      description: 'A collection of miscellaneous tasks and to-dos.',
      userId: userId,
      importance: 'Optional',
    };
    const newProject = await addProject(defaultProject);
    return [newProject];
  }
  return snapshot.docs.map(docToProject);
}

export async function addProject(projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  checkDb();
  const dataWithTimestamp = {
    ...projectData,
    createdAt: new Date(),
  };
  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), dataWithTimestamp);
  return { id: docRef.id, ...dataWithTimestamp };
}

export async function updateProject(projectId: string, projectData: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    checkDb();
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, projectData);
}

export async function deleteProject(projectId: string): Promise<void> {
    checkDb();
    const batch = writeBatch(db);

    // Delete project
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    batch.delete(projectRef);

    // Delete associated tasks
    const tasksQuery = query(collection(db, TASKS_COLLECTION), where("projectId", "==", projectId));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}


// --- Task/Event Functions ---
export async function getTasks(userId: string): Promise<Event[]> {
  checkDb();
  const q = query(collection(db, TASKS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToEvent);
}

export async function addTask(taskData: Omit<Event, 'id'>): Promise<Event> {
  checkDb();
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);
  return { id: docRef.id, ...taskData };
}

export async function addMultipleTasks(tasksData: Omit<Event, 'id'>[]): Promise<Event[]> {
  checkDb();
  const batch = writeBatch(db);
  const newTasks: Event[] = [];
  tasksData.forEach(task => {
    const docRef = doc(collection(db, TASKS_COLLECTION));
    batch.set(docRef, task);
    newTasks.push({ id: docRef.id, ...task });
  });
  await batch.commit();
  return newTasks;
}

export async function updateTask(taskId: string, taskData: Partial<Omit<Event, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, taskData);
}

export async function deleteTask(taskId: string): Promise<void> {
    checkDb();
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
}


// --- Template Functions ---
export async function getProjectTemplates(userId: string): Promise<ProjectTemplate[]> {
  checkDb();
  const q = query(collection(db, TEMPLATES_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToTemplate);
}

export async function addProjectTemplate(templateData: Omit<ProjectTemplate, 'id'>): Promise<ProjectTemplate> {
  checkDb();
  const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), templateData);
  return { id: docRef.id, ...templateData };
}
