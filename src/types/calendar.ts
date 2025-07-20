

export type Event = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  attendees: string[];
  status: 'todo' | 'inProgress' | 'done';
  projectId: string | null;
  isBillable?: boolean;
  billableRate?: number;
  userId: string;
  position: number;
};

    