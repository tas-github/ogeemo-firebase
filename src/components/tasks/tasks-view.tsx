
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, LoaderCircle, ListTodo, Route, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjects, deleteProject, getTasksForUser, addProject, updateProject } from '@/services/project-service';
import { type Project, type Event as TaskEvent } from '@/types/calendar';
import { getContacts, type Contact } from '@/services/contact-service';
import { NewTaskDialog } from './NewTaskDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

const emptyInitialData = {};
export const INBOX_PROJECT_ID = 'inbox';

const ProjectCard = ({ project, tasks, contacts, onEdit, onDelete }: { project: Project, tasks: TaskEvent[], contacts: Contact[], onEdit: (p: Project) => void, onDelete: (p: Project) => void }) => {
    const router = useRouter();
    const isInbox = project.id === INBOX_PROJECT_ID;
    const projectTasks = tasks.filter(t => t.projectId === project.id || (isInbox && !t.projectId));
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const client = contacts.find(c => c.id === project.contactId);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isInbox ? <Inbox className="h-5 w-5" /> : <ListTodo className="h-5 w-5" />}
                    {project.name}
                </CardTitle>
                <CardDescription>{isInbox ? 'Your central place to capture new tasks.' : (client?.name || 'No client assigned')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">Progress</p>
                        <p className="text-sm text-muted-foreground">{completedTasks} of {totalTasks} tasks complete</p>
                    </div>
                    <Progress value={progress} />
                </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => router.push(`/projects/${project.id}/tasks`)}><ListTodo className="mr-2 h-4 w-4" /> Task Board</Button>
                {!isInbox ? (
                  <Button variant="outline" onClick={() => router.push(`/projects/${project.id}/planning`)}><Route className="mr-2 h-4 w-4" /> Planning</Button>
                ) : <div />}
                {!isInbox && (
                    <Button variant="secondary" className="col-span-2" onClick={() => onEdit(project)}>Edit Details</Button>
                )}
            </CardFooter>
        </Card>
    );
};


export function TasksView() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<TaskEvent[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
    const [initialDialogData, setInitialDialogData] = useState(emptyInitialData);
    
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const inboxProject: Project = useMemo(() => ({
        id: INBOX_PROJECT_ID,
        name: "Inbox",
        description: "A place to capture all your incoming tasks and ideas before organizing them.",
        userId: user?.uid || '',
        createdAt: new Date(0), // Puts it at the top when sorting
    }), [user]);

    const allProjectsWithInbox = useMemo(() => {
        // Ensure Inbox is always at the start and not duplicated if fetched
        const userProjects = projects.filter(p => p.id !== INBOX_PROJECT_ID);
        return [inboxProject, ...userProjects];
    }, [projects, inboxProject]);


    useEffect(() => {
        async function loadInitialData() {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [fetchedProjects, fetchedContacts, fetchedTasks] = await Promise.all([
                    getProjects(user.uid),
                    getContacts(user.uid),
                    getTasksForUser(user.uid),
                ]);
                setProjects(fetchedProjects);
                setContacts(fetchedContacts);
                setTasks(fetchedTasks);

                const ideaToProjectRaw = sessionStorage.getItem('ogeemo-idea-to-project');
                if (ideaToProjectRaw) {
                    const ideaData = JSON.parse(ideaToProjectRaw);
                    setInitialDialogData({ title: ideaData.title, description: ideaData.description });
                    setIsNewItemDialogOpen(true);
                    // No need to remove item here, dialog useEffect will handle it
                }

            } catch (error: any) {
                 toast({ variant: 'destructive', title: 'Failed to load initial data', description: error.message });
            } finally {
                setIsLoading(false);
            }
        }
        loadInitialData();
    }, [user, toast]);
    
    const handleProjectCreated = async (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: []) => {
        if (!user) return;
        try {
            const newProject = await addProject({ ...projectData, userId: user.uid, createdAt: new Date() });
            setProjects(prev => [newProject, ...prev]);
            toast({ title: "Project Created", description: `"${newProject.name}" has been successfully created.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to create project", description: error.message });
        }
    };

    const handleProjectUpdated = async (updatedProject: Project) => {
        try {
            const { id, userId, createdAt, ...dataToUpdate } = updatedProject;
            await updateProject(id, dataToUpdate);
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            toast({ title: "Project Updated" });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Failed to update project", description: error.message });
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;
        try {
            const tasksToDelete = await getTasksForProject(projectToDelete.id);
            await deleteProject(projectToDelete.id, tasksToDelete.map(t => t.id));
            
            const newProjects = projects.filter(p => p.id !== projectToDelete.id);
            setProjects(newProjects);
            
            toast({ title: "Project Deleted" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to delete project', description: error.message });
        } finally {
            setProjectToDelete(null);
        }
    };
    
    const handleEditProject = (project: Project) => {
        setProjectToEdit(project);
        setIsNewItemDialogOpen(true);
    };

    return (
        <>
            <div className="p-4 sm:p-6 flex flex-col h-full items-center">
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold font-headline text-primary">Project Manager</h1>
                    <p className="text-muted-foreground">Manage your projects, view tasks, or create a new project.</p>
                </header>

                <div className="w-full max-w-7xl flex-1">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => { setProjectToEdit(null); setInitialDialogData({}); setIsNewItemDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> New Project
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-full pt-16">
                            <LoaderCircle className="h-8 w-8 animate-spin" />
                        </div>
                    ) : allProjectsWithInbox.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allProjectsWithInbox.map((p) => (
                                <ProjectCard
                                    key={p.id}
                                    project={p}
                                    tasks={tasks}
                                    contacts={contacts}
                                    onEdit={handleEditProject}
                                    onDelete={setProjectToDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                            <p className="text-sm text-muted-foreground text-center">
                                No projects yet. Create one to get started.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <NewTaskDialog
                isOpen={isNewItemDialogOpen}
                onOpenChange={(open) => {
                    setIsNewItemDialogOpen(open);
                    if (!open) {
                        setProjectToEdit(null);
                        setInitialDialogData(emptyInitialData);
                    }
                }}
                onProjectCreate={handleProjectCreated}
                onProjectUpdate={handleProjectUpdated}
                contacts={contacts}
                onContactsChange={setContacts}
                projectToEdit={projectToEdit}
                initialData={initialDialogData}
            />

            <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the project "{projectToDelete?.name}" and all of its tasks. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
