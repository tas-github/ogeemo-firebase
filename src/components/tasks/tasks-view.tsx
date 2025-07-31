
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjects, deleteProject, getTasksForProject, addProject, updateProject, type Project, type Event as TaskEvent } from '@/services/project-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { NewTaskDialog } from './NewTaskDialog';
import { ProjectListItem } from './ProjectListItem';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export function TasksView() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
    const [initialDialogData, setInitialDialogData] = useState({});
    
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function loadInitialData() {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [fetchedProjects, fetchedContacts] = await Promise.all([
                    getProjects(user.uid),
                    getContacts(user.uid),
                ]);
                setProjects(fetchedProjects);
                setContacts(fetchedContacts);

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
    
    const onMoveProject = (dragIndex: number, hoverIndex: number) => {
        const draggedProject = projects[dragIndex];
        setProjects(prev => {
            const newProjects = [...prev];
            newProjects.splice(dragIndex, 1);
            newProjects.splice(hoverIndex, 0, draggedProject);
            return newProjects;
        });
        // Here you would call a service to update positions in the backend
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

                <Card className="w-full max-w-4xl flex-1 flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>All Projects</CardTitle>
                                <CardDescription>Click a project to view its tasks.</CardDescription>
                            </div>
                            <Button onClick={() => { setProjectToEdit(null); setInitialDialogData({}); setIsNewItemDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> New Project
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-2">
                        <ScrollArea className="h-full">
                            <div className="p-2 space-y-2">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full pt-16">
                                        <LoaderCircle className="h-8 w-8 animate-spin" />
                                    </div>
                                ) : projects.length > 0 ? (
                                    projects.map((p, index) => (
                                        <ProjectListItem
                                            key={p.id}
                                            project={p}
                                            index={index}
                                            onMoveProject={onMoveProject}
                                            onEdit={handleEditProject}
                                            onDelete={setProjectToDelete}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center p-8">
                                        No projects yet. Create one to get started.
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <NewTaskDialog
                    isOpen={isNewItemDialogOpen}
                    onOpenChange={(open) => {
                        setIsNewItemDialogOpen(open);
                        if (!open) {
                            setProjectToEdit(null);
                            setInitialDialogData({});
                        }
                    }}
                    onProjectCreate={handleProjectCreated}
                    onProjectUpdate={handleProjectUpdated}
                    contacts={contacts}
                    projectToEdit={projectToEdit}
                    initialMode="project"
                    initialData={initialDialogData}
                />
            </div>
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
