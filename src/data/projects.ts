
export interface Project {
  id: string;
  name: string;
  description?: string;
}

export const initialProjects: Project[] = [
  { id: 'proj-1', name: 'Project List', description: 'A collection of miscellaneous tasks and to-dos.' },
  { id: 'proj-2', name: 'Website Redesign V2', description: 'Complete overhaul of the company website, including UI/UX and backend integration.' },
];
