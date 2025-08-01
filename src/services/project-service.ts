
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
  Timestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { type Project, type Event as TaskEvent, type ProjectTemplate, type TaskStatus, type ProjectStep, type ProjectFolder, type ActionChipData } from '@/types/calendar';
import { addMinutes } from 'date-fns';
import { Mail, Briefcase, ListTodo, Calendar, Clock, Contact, Beaker, Calculator, Folder, Wand2, MessageSquare, HardHat, Contact2, Share2, Users2, PackageSearch, Megaphone, Landmark, DatabaseBackup, BarChart3, HeartPulse, Bell, Bug, Database, FilePlus2, LogOut, Settings, Lightbulb } from 'lucide-react';

const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'tasks';
const TEMPLATES_COLLECTION = 'projectTemplates';
const FOLDERS_COLLECTION = 'projectFolders';
const ACTION_CHIPS_COLLECTION = 'actionChips';

async function getDb() {
    const { db } = await initializeFirebase();
    return db;
}

// --- Type Converters ---
const docToProject = (doc: any): Project => {
  const data = doc.data();
  if (!data) throw new Error("Document data is missing.");
  return {
    id: doc.id,
    name: data.name,
    description: data.description || '',
    clientId: data.clientId || null,
    ownerId: data.ownerId || null,
    assigneeIds: data.assigneeIds || [],
    startDate: (data.startDate as Timestamp)?.toDate ? (data.startDate as Timestamp).toDate() : null,
    dueDate: (data.dueDate as Timestamp)?.toDate ? (data.dueDate as Timestamp).toDate() : null,
    userId: data.userId,
    createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(),
    reminder: data.reminder || null,
    steps: (data.steps || []).map((step: any) => ({
        ...step,
        startTime: (step.startTime as Timestamp)?.toDate ? (step.startTime as Timestamp).toDate() : null,
    })),
    folderId: data.folderId || null,
  };
};

const docToTask = (doc: any): TaskEvent => {
  const data = doc.data();
  if (!data) throw new Error("Document data is missing.");
  return {
    id: doc.id,
    title: data.title,
    description: data.description || '',
    start: (data.start as Timestamp)?.toDate ? (data.start as Timestamp).toDate() : new Date(),
    end: (data.end as Timestamp)?.toDate ? (data.end as Timestamp).toDate() : new Date(),
    status: data.status || 'todo',
    position: data.position || 0,
    projectId: data.projectId,
    userId: data.userId,
    assigneeIds: data.assigneeIds || [],
    reminder: data.reminder || null,
    stepId: data.stepId || null,
    contactId: data.contactId || null,
    isScheduled: data.isScheduled || false,
  };
};

const docToTemplate = (doc: any): ProjectTemplate => ({ id: doc.id, ...doc.data() } as ProjectTemplate);
const docToFolder = (doc: any): ProjectFolder => ({ id: doc.id, ...doc.data() } as ProjectFolder);
const docToActionChip = (doc: any): ActionChipData => {
    const data = doc.data();
    const iconName = data.iconName as keyof typeof iconMap;
    return { 
        id: doc.id, 
        ...data,
        icon: iconMap[iconName] || Wand2, // Fallback icon
    } as ActionChipData;
};


// --- Folder Functions ---
export async function getProjectFolders(userId: string): Promise<ProjectFolder[]> {
  const db = await getDb();
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFolder);
}

export async function addProjectFolder(folderData: Omit<ProjectFolder, 'id'>): Promise<ProjectFolder> {
  const db = await getDb();
  const dataToSave = {
    ...folderData,
    parentId: folderData.parentId || null,
  };
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), dataToSave);
  return { id: docRef.id, ...dataToSave };
}


// --- Project Functions ---

export async function getProjects(userId: string): Promise<Project[]> {
  const db = await getDb();
  const q = query(collection(db, PROJECTS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToProject).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getProjectById(projectId: string): Promise<Project | null> {
    const db = await getDb();
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
        return docToProject(projectSnap);
    }
    return null;
}

export async function addProject(projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const db = await getDb();
    const dataWithTimestamp = { ...projectData, createdAt: new Date() };
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), dataWithTimestamp);
    return { id: docRef.id, ...dataWithTimestamp };
}


export async function addProjectWithTasks(
  projectData: Omit<Project, 'id' | 'createdAt'>,
  tasksData: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[]
): Promise<Project> {
  const db = await getDb();
  const batch = writeBatch(db);

  const projectRef = doc(collection(db, PROJECTS_COLLECTION));
  const newProjectData = { ...projectData, steps: [], createdAt: new Date() };
  batch.set(projectRef, newProjectData);

  tasksData.forEach((task, index) => {
    const taskRef = doc(collection(db, TASKS_COLLECTION));
    batch.set(taskRef, {
      ...task,
      projectId: projectRef.id,
      userId: projectData.userId,
      position: index, // Set initial position
    });
  });

  await batch.commit();
  return { id: projectRef.id, ...newProjectData, createdAt: newProjectData.createdAt };
}

export async function updateProject(projectId: string, projectData: Partial<Omit<Project, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, projectData);
}

export async function updateProjectWithTasks(userId: string, projectId: string, projectData: Partial<Omit<Project, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const batch = writeBatch(db);
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

    const stepsToSave = (projectData.steps || []).map(step => {
        const finalId = (step.id && !step.id.startsWith('temp_')) ? step.id : doc(collection(db, 'projects')).id;
        return { ...step, id: finalId };
    });

    batch.update(projectRef, { ...projectData, steps: stepsToSave });

    const existingTasksQuery = query(collection(db, TASKS_COLLECTION), where("projectId", "==", projectId));
    const existingTasksSnapshot = await getDocs(existingTasksQuery);
    const existingTasks = existingTasksSnapshot.docs.map(docToTask);
    
    const tasksByStepId = new Map(existingTasks.filter(t => t.stepId).map(t => [t.stepId, t]));
    const stepsInPlan = new Set(stepsToSave.map(s => s.id));

    for (const step of stepsToSave) {
        if (!step.id) continue;
        const existingTask = tasksByStepId.get(step.id);

        if (step.connectToCalendar && step.startTime) {
            const taskData: Partial<Omit<TaskEvent, 'id' | 'userId'>> = {
                title: step.title,
                description: step.description,
                start: step.startTime,
                end: addMinutes(step.startTime, step.durationMinutes!),
                status: 'todo',
                position: 0,
                projectId,
                stepId: step.id,
                isScheduled: true,
            };

            if (existingTask) {
                const taskRef = doc(db, TASKS_COLLECTION, existingTask.id);
                batch.update(taskRef, taskData);
            } else {
                const taskRef = doc(collection(db, TASKS_COLLECTION));
                batch.set(taskRef, { ...taskData, userId });
            }
        } else if (!step.connectToCalendar && existingTask) {
            const taskRef = doc(db, TASKS_COLLECTION, existingTask.id);
            batch.delete(taskRef);
        }
    }

    for (const task of existingTasks) {
        if (task.stepId && !stepsInPlan.has(task.stepId)) {
            const taskRef = doc(db, TASKS_COLLECTION, task.id);
            batch.delete(taskRef);
        }
    }
    
    await batch.commit();
}


export async function deleteProject(projectId: string, taskIds: string[]): Promise<void> {
    const db = await getDb();
    const batch = writeBatch(db);
    
    taskIds.forEach(taskId => {
        const taskRef = doc(db, TASKS_COLLECTION, taskId);
        batch.delete(taskRef);
    });
    
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    batch.delete(projectRef);

    await batch.commit();
}

// --- Task Functions ---

export async function getTasksForProject(projectId: string): Promise<TaskEvent[]> {
  const db = await getDb();
  const q = query(collection(db, TASKS_COLLECTION), where("projectId", "==", projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToTask);
}

export async function getTasksForUser(userId: string): Promise<TaskEvent[]> {
    const db = await getDb();
    const q = query(collection(db, TASKS_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToTask);
}

export async function addTask(taskData: Omit<TaskEvent, 'id'>): Promise<TaskEvent> {
  const db = await getDb();
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);
  return { id: docRef.id, ...taskData };
}

export async function updateTask(taskId: string, taskData: Partial<Omit<TaskEvent, 'id' | 'userId'>>): Promise<void> {
    const db = await getDb();
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, taskData);
}

export async function updateTaskPositions(tasksToUpdate: { id: string; position: number; status: TaskStatus }[]): Promise<void> {
    const db = await getDb();
    const batch = writeBatch(db);
    tasksToUpdate.forEach(task => {
        const taskRef = doc(db, TASKS_COLLECTION, task.id);
        batch.update(taskRef, { position: task.position, status: task.status });
    });
    await batch.commit();
}


export async function deleteTask(taskId: string): Promise<void> {
    const db = await getDb();
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
}

// --- Template Functions ---

export async function getProjectTemplates(userId: string): Promise<ProjectTemplate[]> {
    const db = await getDb();
    const q = query(collection(db, TEMPLATES_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToTemplate);
}

export async function addProjectTemplate(templateData: Omit<ProjectTemplate, 'id'>): Promise<ProjectTemplate> {
    const db = await getDb();
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), templateData);
    return { id: docRef.id, ...templateData };
}

// --- Action Chip Functions ---

const iconMap: { [key: string]: LucideIcon } = { Mail, Briefcase, ListTodo, Calendar, Clock, Contact, Beaker, Calculator, Folder, Wand2, MessageSquare, HardHat, Contact2, Share2, Users2, PackageSearch, Megaphone, Landmark, DatabaseBackup, BarChart3, HeartPulse, Bell, Bug, Database, FilePlus2, LogOut, Settings, Lightbulb };

const defaultChips: Omit<ActionChipData, 'id' | 'userId'>[] = [
  { label: 'OgeeMail', icon: Mail, href: '/ogeemail' },
  { label: 'Contacts', icon: Contact, href: '/contacts' },
  { label: 'Projects', icon: Briefcase, href: '/projects' },
  { label: 'Files', icon: Folder, href: '/files' },
];

async function getChipsFromCollection(userId: string, collectionName: string): Promise<ActionChipData[]> {
    const db = await getDb();
    const docRef = doc(db, collectionName, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure chips is an array before mapping
        return (data.chips || []).map((chip: any) => ({
            ...chip,
            icon: iconMap[chip.iconName as keyof typeof iconMap] || Wand2,
        }));
    }
    return [];
}

async function updateChipsInCollection(userId: string, collectionName: string, chips: ActionChipData[]): Promise<void> {
    const db = await getDb();
    const docRef = doc(db, collectionName, userId);
    const chipsToSave = chips.map((chip, index) => {
        const iconName = Object.keys(iconMap).find(key => iconMap[key] === chip.icon);
        const { icon, ...rest } = chip; // remove icon component before saving
        return { ...rest, position: index, iconName };
    });
    await setDoc(docRef, { chips: chipsToSave }, { merge: true });
}


export async function getActionChips(userId: string): Promise<ActionChipData[]> {
    const chips = await getChipsFromCollection(userId, ACTION_CHIPS_COLLECTION);
    if (chips.length === 0) {
        // First time user, create default chips
        await updateActionChips(userId, defaultChips);
        return defaultChips.map(c => ({...c, id: `default-${c.label}`, userId}));
    }
    return chips;
}

export async function updateActionChips(userId: string, chips: ActionChipData[]): Promise<void> {
    await updateChipsInCollection(userId, ACTION_CHIPS_COLLECTION, chips);
}

export async function addActionChip(chipData: Omit<ActionChipData, 'id'>): Promise<ActionChipData> {
  const db = await getDb();
  // Since we are now storing chips in an array within a single document,
  // we need to fetch the existing array, add to it, and then save it back.
  const existingChips = await getActionChips(chipData.userId);
  const newChip = { ...chipData, id: `chip_${Date.now()}` };
  const updatedChips = [...existingChips, newChip];
  await updateActionChips(chipData.userId, updatedChips);
  return newChip;
}

export async function getTrashedActionChips(userId: string): Promise<ActionChipData[]> {
    return await getChipsFromCollection(userId, 'trashedActionChips');
}

export async function updateTrashedActionChips(userId: string, chips: ActionChipData[]): Promise<void> {
    await updateChipsInCollection(userId, 'trashedActionChips', chips);
}


// --- Data for Dialogs ---
export type ManagerOption = { label: string; href: string; icon: LucideIcon };
export const managerOptions: ManagerOption[] = [
    { label: 'OgeeMail', icon: Mail, href: '/ogeemail' },
    { label: 'Communications', icon: MessageSquare, href: '/communications' },
    { label: 'Contacts', icon: Contact, href: '/contacts' },
    { label: 'Projects', icon: Briefcase, href: '/projects' },
    { label: 'Tasks', icon: ListTodo, href: '/tasks' },
    { label: 'Calendar', icon: Calendar, href: '/calendar' },
    { label: 'Files', icon: Folder, href: '/files' },
    { label: 'Ideas', icon: Lightbulb, href: '/ideas' },
    { label: 'Research', icon: Beaker, href: '/research' },
    { label: 'Accounting', icon: Calculator, href: '/accounting' },
    { label: 'Time', icon: Clock, href: '/time' },
    { label: 'HR Manager', icon: Contact2, href: '/hr-manager' },
    { label: 'Social Media', icon: Share2, href: '/social-media-manager' },
    { label: 'CRM', icon: Users2, href: '/crm' },
    { label: 'Inventory', icon: PackageSearch, href: '/inventory-manager' },
    { label: 'Marketing', icon: Megaphone, href: '/marketing-manager' },
    { label: 'Legal Hub', icon: Landmark, href: '/legal-hub' },
    { label: 'Backup', icon: DatabaseBackup, href: '/backup' },
    { label: 'Reports', icon: BarChart3, href: '/reports' },
    { label: 'Hytexercise', icon: HeartPulse, href: '/hytexercise' },
    { label: 'Alerts', icon: Bell, href: '/alerts' },
];
