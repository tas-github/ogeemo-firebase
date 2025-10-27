
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase, ListChecks, Info, Plus, ListTodo, Route } from 'lucide-react';
import { NewTaskDialog } from './NewTaskDialog';
import { useAuth } from '@/context/auth-context';
import { addProject, getProjects } from '@/services/project-service';
import { type Project, type Event as TaskEvent } from '@/types/calendar-types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getContacts, type Contact } from '@/services/contact-service';

export function ProjectManagementHeader() {
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [initialDialogData, setInitialDialogData] = useState({});
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            if (!user) {
                setIsLoading(false);
                return;
            }
            try {
                const [fetchedProjects, fetchedContacts] = await Promise.all([
                    getProjects(user.uid),
                    getContacts(user.uid),
                ]);
                setProjects(fetchedProjects);
                setContacts(fetchedContacts);
            } catch (error: any) {
                console.error("Failed to load header data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user]);
    
    const handleNewProjectClick = () => {
        setInitialDialogData({}); // Clear any previous initial data
        setIsNewProjectDialogOpen(true);
    };

    const handleProjectCreated = async (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[]) => {
        if (!user) return;
        try {
            const newProject = await addProject({ ...projectData, status: 'planning', userId: user.uid, createdAt: new Date() });
            toast({ title: "Project Created", description: `"${newProject.name}" has been successfully created.` });
            router.push(`/projects/${newProject.id}/tasks`);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to create project", description: error.message });
        }
    };
    
    const firstProjectId = projects.length > 0 ? projects[0].id : 'placeholder';

    return (
        <>
            <div className="flex justify-center gap-2 pb-4">
                <Button asChild variant="outline">
                    <Link href="/projects">
                        <Briefcase className="mr-2 h-4 w-4" /> Project Hub
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/projects/all">
                        <Briefcase className="mr-2 h-4 w-4" /> Project List
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/project-status">
                        <ListChecks className="mr-2 h-4 w-4" /> Status Board
                    </Link>
                </Button>
                 <Button asChild variant="outline" disabled={isLoading || projects.length === 0}>
                    <Link href={`/projects/${firstProjectId}/timeline`}>
                        <Route className="mr-2 h-4 w-4" /> Timeline
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/tasks">
                        <ListTodo className="mr-2 h-4 w-4" /> All Tasks
                    </Link>
                </Button>
                 <Button onClick={handleNewProjectClick}>
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
                 <Button asChild variant="ghost" size="icon">
                    <Link href="/projects/instructions">
                        <Info className="h-5 w-5" />
                        <span className="sr-only">Project Management Instructions</span>
                    </Link>
                </Button>
            </div>
             <NewTaskDialog
                isOpen={isNewProjectDialogOpen}
                onOpenChange={setIsNewProjectDialogOpen}
                onProjectCreate={handleProjectCreated}
                contacts={contacts}
                onContactsChange={setContacts}
                projectToEdit={null}
                initialData={initialDialogData}
            />
        </>
    );
}
