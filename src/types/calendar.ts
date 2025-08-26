
import type { LucideIcon } from 'lucide-react';

export type TaskStatus = 'todo' | 'inProgress' | 'done';

// Unified "Activity" model for Tasks, Events, Appointments, etc.
export interface Event {
  id: string;
  title: string;
  description?: string;
  
  // Scheduling fields
  start: Date;
  end: Date;
  isScheduled?: boolean;

  // Kanban fields
  status: TaskStatus;
  position: number;
  
  // Relational fields
  projectId?: string | null;
  contactId?: string | null;
  userId: string;
  
  // Time Tracking fields
  duration?: number; // in seconds
  isBillable?: boolean;
  billableRate?: number;

  // For project planning linkage
  stepId?: string | null;
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
  userId: string;
  createdAt: Date;
  steps?: ProjectStep[];
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
