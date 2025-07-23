

export type TaskStatus = 'todo' | 'inProgress' | 'done';

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  status?: TaskStatus;
  position: number;
  projectId: string;
  userId: string;
  assigneeIds?: string[];
  reminder?: string | null;
}

export interface ProjectStep {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
    isBillable: boolean;
    connectToCalendar: boolean;
    isCompleted: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string | null;
  ownerId: string | null;
  assigneeIds: string[];
  startDate?: Date | null;
  dueDate?: Date | null;
  userId: string;
  createdAt: Date;
  reminder?: string | null;
  steps?: ProjectStep[];
}

export interface ProjectTemplate {
    id: string;
    name: string;
    steps: { title: string; defaultDurationHours: number; }[];
    userId: string;
}
