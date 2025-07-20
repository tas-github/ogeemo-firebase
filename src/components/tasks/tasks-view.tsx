
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjects, deleteProject, getTasksForProject, type Project, type Event as TaskEvent } from '@/services/project-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { NewProjectDialog } from './NewProjectDialog';
import { ProjectDetailsDialog } from './ProjectDetailsDialog';
import { ProjectListItem } from './ProjectListItem';
import { ScrollArea } from '@/components/ui/scroll-area';

function TasksViewContent() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    
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
                    setIsNewProjectDialogOpen(true);
                }

            } catch (error: any) {
                 toast({ variant: 'destructive', title: 'Failed to load initial data', description: error.message });
            } finally {
                setIsLoading(false);
            }
        }
        loadInitialData();
    }, [user, toast]);
    
    const handleProjectCreated = (newProject: Project) => {
        setProjects(prev => [newProject, ...prev]);
    };
    
    const handleDeleteProject = async (projectToDelete: Project) => {
        if (!projectToDelete) return;
        if (window.confirm(`Are you sure you want to delete the project "${projectToDelete.name}" and all its tasks? This action cannot be undone.`)) {
            try {
                const tasksToDelete = await getTasksForProject(projectToDelete.id);
                await deleteProject(projectToDelete.id, tasksToDelete.map(t => t.id));
                
                const newProjects = projects.filter(p => p.id !== projectToDelete.id);
                setProjects(newProjects);
                
                toast({ title: "Project Deleted" });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to delete project', description: error.message });
            }
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
    };

    return (
        <div className="p-4 sm:p-6 flex flex-col h-full items-center">
            <header className="text-center mb-6">
                <h1 className="text-3xl font-bold font-headline text-primary">Project Hub</h1>
                <p className="text-muted-foreground">Select a project to view its tasks or create a new one.</p>
            </header>

            <Card className="w-full max-w-4xl flex-1 flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Projects</CardTitle>
                            <CardDescription>Click a project to view its tasks.</CardDescription>
                        </div>
                        <Button onClick={() => setIsNewProjectDialogOpen(true)}>
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
                                        onDelete={handleDeleteProject}
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

            <NewProjectDialog
                isOpen={isNewProjectDialogOpen}
                onOpenChange={setIsNewProjectDialogOpen}
                onProjectCreated={handleProjectCreated}
                contacts={contacts}
            />
            {projectToEdit && (
                <ProjectDetailsDialog
                    isOpen={!!projectToEdit}
                    onOpenChange={(open) => !open && setProjectToEdit(null)}
                    project={projectToEdit}
                    contacts={contacts}
                    onProjectUpdated={(updatedProject) => {
                        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                    }}
                />
            )}
        </div>
    );
}

export function TasksView() {
    return (
        <DndProvider backend={HTML5Backend}>
            <TasksViewContent />
        </DndProvider>
    );
}
