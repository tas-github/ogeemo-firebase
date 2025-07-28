
import { adminAuth } from '@/lib/firebase-admin';
import { TimeManagerView } from './time-manager-view';
import { getProjects } from '@/services/project-service';
import { getContacts } from '@/services/contact-service';
import { cookies } from 'next/headers';

export async function TimeManagerLoader() {
    console.log('TimeManagerLoader rendering on server...');
    let uid = null;
    const sessionCookie = cookies().get('session')?.value;
    console.log('Session cookie found on server:', !!sessionCookie);

    if (sessionCookie) {
        try {
            console.log('Verifying session cookie...');
            const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
            uid = decodedToken.uid;
            console.log('Session cookie verified. UID:', uid);
        } catch (error) {
            console.error('Error verifying session cookie:', error);
        }
    }

    if (!uid) {
        console.log('No UID found, displaying login message.');
        // This case should ideally be handled by middleware redirecting to login
        return <div>Please log in to view this page.</div>;
    }

    console.log('Fetching projects and contacts for UID:', uid);
    const projects = await getProjects(uid);
    const contacts = await getContacts(uid);
    console.log('Data fetching complete.');

    return <TimeManagerView projects={projects} contacts={contacts} />;
}
