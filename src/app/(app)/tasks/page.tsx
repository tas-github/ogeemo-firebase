
import { redirect } from 'next/navigation';

export default function TasksRedirectPage() {
  // This page now redirects to the main Project Manager view
  // to ensure a single, consistent entry point for projects and tasks.
  redirect('/projects');
}
