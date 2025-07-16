
import { redirect } from 'next/navigation';

// This page is now redundant. The content has been moved to /dashboard.
export default function OldDashboardRedirect() {
  redirect('/dashboard');
}
