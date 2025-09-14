
import { redirect } from 'next/navigation';

export default function ProjectsRedirectPage() {
  // This page is now obsolete. The primary view for projects
  // is now the unified Task List view.
  redirect('/tasks');
}
