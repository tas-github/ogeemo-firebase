
export type TaskStatus = 'todo' | 'inProgress' | 'done';

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  status?: TaskStatus;
  position: number;
  projectId: string;
  userId: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string | null;
  dueDate?: Date | null;
  userId: string;
  createdAt: Date;
}

export interface ProjectTemplate {
    id: string;
    name: string;
    steps: { title: string; defaultDurationHours: number; }[];
    userId: string;
}
