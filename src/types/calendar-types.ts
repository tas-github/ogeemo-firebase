
import type { LucideIcon } from 'lucide-react';

export type TaskStatus = 'todo' | 'inProgress' | 'done';

export interface TimeSession {
  id: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  notes?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start?: Date;
  end?: Date;
  status: TaskStatus;
  position: number;
  projectId?: string | null;
  stepId?: string | null;
  userId: string;
  attendees?: string[];
  contactId?: string | null;
  isScheduled?: boolean;
  duration?: number; // in seconds, CUMULATIVE total
  isBillable?: boolean;
  billableRate?: number; // rate per hour
  sessions?: TimeSession[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId?: string | null;
  contactId?: string | null;
  userId: string;
  createdAt: Date;
  steps?: ProjectStep[];
}

export interface ProjectStep {
    id: string;
    title: string;
    description?: string;
    durationMinutes?: number;
    isBillable: boolean;
    connectToCalendar: boolean;
    startTime: Date | null;
    isCompleted: boolean;
}

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    tasks: Omit<Event, 'id' | 'projectId' | 'userId'>[];
    userId: string;
}

export interface ProjectFolder {
    id: string;
    name: string;
    parentId?: string | null;
    userId: string;
}

export interface ActionChipData {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string | { pathname: string; query?: { [key: string]: string } };
  userId: string;
}
