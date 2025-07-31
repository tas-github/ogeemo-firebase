
import { TimeManagerView } from './time-manager-view';
import { getProjects } from '@/services/project-service';
import { getContacts } from '@/services/contact-service';
import { getCurrentUserId } from '@/app/actions';

export async function TimeManagerLoader() {
    console.log('TimeManagerLoader rendering on server...');
    const uid = await getCurrentUserId();

    if (!uid) {
        console.log('No UID found from server action, displaying login message.');
        // This case should be handled by middleware/AuthProvider, but serves as a fallback.
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="font-semibold">Authentication Error</p>
                    <p className="text-sm text-muted-foreground">Please log in to view this page.</p>
                </div>
            </div>
        );
    }

    console.log('Fetching projects and contacts for UID:', uid);
    // Fetch data in parallel for better performance
    const [projects, contacts] = await Promise.all([
        getProjects(uid),
        getContacts(uid),
    ]);
    console.log('Data fetching complete on server.');

    return <TimeManagerView projects={projects} contacts={contacts} />;
}
