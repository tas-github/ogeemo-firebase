
'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
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
  const q = db.collection(PROJECTS_COLLECTION).where("userId", "==", userId);
  const snapshot = await q.get();
  return snapshot.docs.map(docToProject).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getProjectById(projectId: string): Promise<Project | null> {
    checkDb();
    const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);
    const projectSnap = await projectRef.get();
    if (projectSnap.exists) {
        return docToProject(projectSnap);
    }
    return null;
}

export async function addProjectWithTasks(
  projectData: Omit<Project, 'id' | 'createdAt'>,
  tasksData: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[]
): Promise<Project> {
  checkDb();
  const batch = db.batch();

  const projectRef = db.collection(PROJECTS_COLLECTION).doc();
  const newProjectData = { ...projectData, steps: [], createdAt: new Date() };
  batch.set(projectRef, newProjectData);

  tasksData.forEach((task, index) => {
    const taskRef = db.collection(TASKS_COLLECTION).doc();
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
    const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);
    await projectRef.update(projectData);
}

export async function updateProjectWithTasks(userId: string, projectId: string, projectData: Partial<Omit<Project, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const batch = db.batch();
    const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);

    const stepsToSave = (projectData.steps || []).map(step => {
        const finalId = (step.id && !step.id.startsWith('temp_')) ? step.id : db.collection('projects').doc().id;
        return { ...step, id: finalId };
    });

    batch.update(projectRef, { ...projectData, steps: stepsToSave });

    const existingTasksQuery = db.collection(TASKS_COLLECTION).where("projectId", "==", projectId);
    const existingTasksSnapshot = await existingTasksQuery.get();
    const existingTasks = existingTasksSnapshot.docs.map(docToTask);
    
    const tasksByStepId = new Map(existingTasks.filter(t => t.stepId).map(t => [t.stepId, t]));
    const stepsInPlan = new Set(stepsToSave.map(s => s.id));

    for (const step of stepsToSave) {
        if (!step.id) continue;
        const existingTask = tasksByStepId.get(step.id);

        if (step.connectToCalendar && step.startTime) {
            const taskData: Omit<TaskEvent, 'id' | 'userId'> = {
                title: step.title,
                description: step.description,
                start: step.startTime,
                end: addMinutes(step.startTime, step.durationMinutes),
                status: 'todo',
                position: 0,
                projectId,
                stepId: step.id,
            };

            if (existingTask) {
                const taskRef = db.collection(TASKS_COLLECTION).doc(existingTask.id);
                batch.update(taskRef, taskData);
            } else {
                const taskRef = db.collection(TASKS_COLLECTION).doc();
                batch.set(taskRef, { ...taskData, userId });
            }
        } else if (!step.connectToCalendar && existingTask) {
            const taskRef = db.collection(TASKS_COLLECTION).doc(existingTask.id);
            batch.delete(taskRef);
        }
    }

    for (const task of existingTasks) {
        if (task.stepId && !stepsInPlan.has(task.stepId)) {
            const taskRef = db.collection(TASKS_COLLECTION).doc(task.id);
            batch.delete(taskRef);
        }
    }
    
    await batch.commit();
}


export async function deleteProject(projectId: string, taskIds: string[]): Promise<void> {
    checkDb();
    const batch = db.batch();
    
    taskIds.forEach(taskId => {
        const taskRef = db.collection(TASKS_COLLECTION).doc(taskId);
        batch.delete(taskRef);
    });
    
    const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);
    batch.delete(projectRef);

    await batch.commit();
}

// --- Task Functions ---

export async function getTasksForProject(projectId: string): Promise<TaskEvent[]> {
  checkDb();
  const q = db.collection(TASKS_COLLECTION).where("projectId", "==", projectId);
  const snapshot = await q.get();
  return snapshot.docs.map(docToTask);
}

export async function getTasksForUser(userId: string): Promise<TaskEvent[]> {
    checkDb();
    const q = db.collection(TASKS_COLLECTION).where("userId", "==", userId);
    const snapshot = await q.get();
    return snapshot.docs.map(docToTask);
}

export async function addTask(taskData: Omit<TaskEvent, 'id'>): Promise<TaskEvent> {
  checkDb();
  const docRef = await db.collection(TASKS_COLLECTION).add(taskData);
  return { id: docRef.id, ...taskData };
}

export async function updateTask(taskId: string, taskData: Partial<Omit<TaskEvent, 'id' | 'userId'>>): Promise<void> {
    checkDb();
    const taskRef = db.collection(TASKS_COLLECTION).doc(taskId);
    await taskRef.update(taskData);
}

export async function updateTaskPositions(tasksToUpdate: { id: string; position: number; status: TaskStatus }[]): Promise<void> {
    checkDb();
    const batch = db.batch();
    tasksToUpdate.forEach(task => {
        const taskRef = db.collection(TASKS_COLLECTION).doc(task.id);
        batch.update(taskRef, { position: task.position, status: task.status });
    });
    await batch.commit();
}


export async function deleteTask(taskId: string): Promise<void> {
    checkDb();
    await db.collection(TASKS_COLLECTION).doc(taskId).delete();
}

// --- Template Functions ---

export async function getProjectTemplates(userId: string): Promise<ProjectTemplate[]> {
    checkDb();
    const q = db.collection(TEMPLATES_COLLECTION).where("userId", "==", userId);
    const snapshot = await q.get();
    return snapshot.docs.map(docToTemplate);
}

export async function addProjectTemplate(templateData: Omit<ProjectTemplate, 'id'>): Promise<ProjectTemplate> {
    checkDb();
    const docRef = await db.collection(TEMPLATES_COLLECTION).add(templateData);
    return { id: docRef.id, ...templateData };
}
