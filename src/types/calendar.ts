export type Event = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  attendees: string[];
  status: 'todo' | 'inProgress' | 'done';
};
