
import { redirect } from 'next/navigation';

export default function DataUpdaterRedirectPage() {
  // This tool was temporary and is no longer needed.
  // Redirecting to the main accounting hub.
  redirect('/accounting');
}
