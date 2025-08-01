
import type { LucideIcon } from 'lucide-react';

export type TaskStatus = 'todo' | 'inProgress' | 'done';

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  status?: TaskStatus;
  position: number;
  projectId?: string | null;
  userId: string;
  assigneeIds?: string[];
  attendees?: string[];
  reminder?: string | null;
  stepId?: string | null; // Link back to the project step
  contactId?: string | null;
  billableRate?: number;
  duration?: number; // in seconds
  isScheduled?: boolean;
}

export interface ProjectStep {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
    isBillable: boolean;
    connectToCalendar: boolean;
    startTime?: Date | null;
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
  folderId?: string | null;
}

export interface ProjectFolder {
    id: string;
    name: string;
    parentId: string | null;
    userId: string;
}

export interface ProjectTemplate {
    id: string;
    name: string;
    steps: { title: string; defaultDurationHours: number; }[];
    userId: string;
}

export interface ActionChipData {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string | { pathname: string; query?: { [key: string]: string } };
  userId: string;
}
