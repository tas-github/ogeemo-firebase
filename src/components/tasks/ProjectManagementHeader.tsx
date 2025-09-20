
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase, ListChecks, Inbox, Info, Plus } from 'lucide-react';
import { NewTaskDialog } from './NewTaskDialog'; // Assuming NewTaskDialog handles project creation
import { useAuth } from '@/context/auth-context';
import { addProject } from '@/services/project-service';
import { type Project, type Event as TaskEvent } from '@/types/calendar-types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


interface ProjectManagementHeaderProps {
    // onNewProjectClick is now handled internally
}

export function ProjectManagementHeader({}: ProjectManagementHeaderProps) {
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = React.useState(false);
    const [initialDialogData, setInitialDialogData] = React.useState({});
    const [contacts, setContacts] = React.useState([]); // Assuming contacts are needed for the dialog
    
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const handleNewProjectClick = () => {
        setInitialDialogData({}); // Clear any previous initial data
        setIsNewProjectDialogOpen(true);
    };

    const handleProjectCreated = async (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[]) => {
        if (!user) return;
        try {
            const newProject = await addProject({ ...projectData, status: 'planning', userId: user.uid, createdAt: new Date() });
            toast({ title: "Project Created", description: `"${newProject.name}" has been successfully created.` });
            router.push(`/projects/${newProject.id}/tasks`); // Navigate to the new project board
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to create project", description: error.message });
        }
    };


    return (
        <>
            <div className="flex justify-center gap-2 pb-4">
                <Button asChild variant="outline">
                    <Link href="/projects">
                        <Briefcase className="mr-2 h-4 w-4" /> All Projects
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/project-status">
                        <ListChecks className="mr-2 h-4 w-4" /> Status Board
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/tasks">
                        <Inbox className="mr-2 h-4 w-4" /> Action Items
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
