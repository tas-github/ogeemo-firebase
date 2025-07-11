
export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
}

// This mock data is kept for components that haven't been migrated yet (e.g., Dashboard)
// The main Projects/Tasks manager will use the new project service to fetch from Firestore.
export const initialProjects: Project[] = [
  { id: 'proj-1', name: 'Project List', description: 'A collection of miscellaneous tasks and to-dos.', userId: 'mock-user' },
  { id: 'proj-2', name: 'Website Redesign V2', description: 'Complete overhaul of the company website, including UI/UX and backend integration.', userId: 'mock-user' },
];
