
import { redirect } from 'next/navigation';

// This is a temporary redirect to handle an old, hardcoded link.
// The new primary task board is at /tasks.
export default function ObsoleteTaskBoardRedirectPage() {
    redirect('/tasks');
}
