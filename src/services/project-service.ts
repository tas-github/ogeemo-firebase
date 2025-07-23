

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
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { type Project, type Event as TaskEvent, type ProjectTemplate, type TaskStatus, type ProjectStep } from '@/types/calendar';
import { addMinutes } from 'date-fns';

const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'tasks';
const TEMPLATES_COLLECTION = 'projectTemplates';

function checkDb() {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

// --- Type Converters ---
const docToProject = (doc: QueryDocumentSnapshot<DocumentData> | DocumentData): Project => {
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
  };
};

const docToTask = (doc: QueryDocumentSnapshot<DocumentData> | DocumentData): TaskEvent => {
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
  };
};

const docToTemplate = (doc: QueryDocumentSnapshot<DocumentData>): ProjectTemplate => ({ id: doc.id, ...doc.data() } as ProjectTemplate);

// --- Project Functions ---

export async function getProjects(userId: string): Promise<Project[]> {
  checkDb();
  const q = query(collection(db, PROJECTS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToProject).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getProjectById(projectId: string): Promise<Project | null> {
    checkDb();
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
        return docToProject(projectSnap);
    }
    return null;
}

export async function addProjectWithTasks(
  projectData: Omit<Project, 'id' | 'createdAt'>,
  tasksData: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[]
): Promise<Project> {
  checkDb();
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
  return { id: projectRef.id, ...newProjectData };
}

export async function updateProject(projectId: string, projectData: Partial<Omit<Project, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, projectData);
}

export async function updateProjectWithTasks(userId: string, projectId: string, projectData: Partial<Omit<Project, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const batch = writeBatch(db);
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

    const stepsToSave = projectData.steps?.map(step => {
        // Assign a new ID if it's a temporary one from the frontend
        const finalId = (step.id && !step.id.startsWith('temp_')) ? step.id : doc(collection(db, 'projects')).id;
        return { ...step, id: finalId };
    }) || [];

    batch.update(projectRef, { ...projectData, steps: stepsToSave });

    const existingTasksQuery = query(collection(db, TASKS_COLLECTION), where("projectId", "==", projectId));
    const existingTasksSnapshot = await getDocs(existingTasksQuery);
    const existingTasks = existingTasksSnapshot.docs.map(docToTask);
    
    // Map existing tasks by their stepId for quick lookup
    const tasksByStepId = new Map(existingTasks.map(t => [t.stepId, t]));
    const stepsInPlan = new Set(stepsToSave.map(s => s.id));

    // Create or update tasks for each step in the plan
    for (const step of stepsToSave) {
        const existingTask = tasksByStepId.get(step.id);

        if (step.connectToCalendar && step.startTime && step.id) {
            const taskData = {
                title: step.title,
                description: step.description,
                start: step.startTime,
                end: addMinutes(step.startTime, step.durationMinutes),
                status: 'todo' as TaskStatus,
                position: 0,
                projectId,
                userId,
                stepId: step.id,
            };

            if (existingTask) {
                // Update existing task
                const taskRef = doc(db, TASKS_COLLECTION, existingTask.id);
                batch.update(taskRef, taskData);
            } else {
                // Create new task for this step
                const taskRef = doc(collection(db, TASKS_COLLECTION));
                batch.set(taskRef, taskData);
            }
        } else if (!step.connectToCalendar && existingTask) {
            // Delete task if it's no longer connected to calendar
            const taskRef = doc(db, TASKS_COLLECTION, existingTask.id);
            batch.delete(taskRef);
        }
    }

    // Delete tasks for steps that are no longer in the plan
    for (const task of existingTasks) {
        if (task.stepId && !stepsInPlan.has(task.stepId)) {
            const taskRef = doc(db, TASKS_COLLECTION, task.id);
            batch.delete(taskRef);
        }
    }
    
    await batch.commit();
}


export async function deleteProject(projectId: string, taskIds: string[]): Promise<void> {
    checkDb();
    const batch = writeBatch(db);
    
    // Delete all tasks associated with the project
    taskIds.forEach(taskId => {
        const taskRef = doc(db, TASKS_COLLECTION, taskId);
        batch.delete(taskRef);
    });
    
    // Delete the project itself
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    batch.delete(projectRef);

    await batch.commit();
}

// --- Task Functions ---

export async function getTasksForProject(projectId: string): Promise<TaskEvent[]> {
  checkDb();
  const q = query(collection(db, TASKS_COLLECTION), where("projectId", "==", projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToTask);
}

export async function addTask(taskData: Omit<TaskEvent, 'id'>): Promise<TaskEvent> {
  checkDb();
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);
  return { id: docRef.id, ...taskData };
}

export async function updateTask(taskId: string, taskData: Partial<Omit<TaskEvent, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, taskData);
}

export async function updateTaskPositions(tasksToUpdate: { id: string; position: number; status: TaskStatus }[]): Promise<void> {
    checkDb();
    const batch = writeBatch(db);
    tasksToUpdate.forEach(task => {
        const taskRef = doc(db, TASKS_COLLECTION, task.id);
        batch.update(taskRef, { position: task.position, status: task.status });
    });
    await batch.commit();
}


export async function deleteTask(taskId: string): Promise<void> {
    checkDb();
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
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
