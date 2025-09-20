
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, LoaderCircle, MoreVertical, Edit, Trash2, ArrowUpDown, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjects, deleteProject, getTasksForProject, addProject, updateProject } from '@/services/project-service';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectManagementHeader } from './ProjectManagementHeader';

const emptyInitialData = {};

const statusDisplayMap: Record<string, string> = {
    planning: 'In Planning',
    active: 'Active',
    'on-hold': 'On-Hold',
    completed: 'Completed',
};

const ProjectListItem = ({ project, contacts, onEdit, onDelete }: { project: Project, contacts: Contact[], onEdit: (p: Project) => void, onDelete: (p: Project) => void }) => {
    const client = contacts.find(c => c.id === project.contactId);
    const projectManager = contacts.find(c => c.id === project.projectManagerId);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(project);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(project);
    }

    return (
        <div
            className="group flex items-center p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={handleEditClick}
        >
            <div className="flex-1 grid grid-cols-4 items-center gap-4">
                <div className="col-span-1">
                    <p className="font-semibold">{project.name}</p>
                </div>
                <div className="col-span-1">
                    <p className="text-sm text-muted-foreground">{client?.name || 'No client assigned'}</p>
                </div>
                <div className="col-span-1 text-center">
                    <p className="text-sm text-muted-foreground">{projectManager?.name || 'N/A'}</p>
                </div>
                <div className="col-span-1 text-center">
                    <span className="text-sm text-muted-foreground">
                        {statusDisplayMap[project.status || 'planning'] || 'Planning'}
                    </span>
                </div>
            </div>
            <div className="pl-4 w-[52px]">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={handleEditClick}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Open / Edit Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={handleDeleteClick}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export function AllProjectsView() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
    const [initialDialogData, setInitialDialogData] = useState(emptyInitialData);
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'clientName' | 'status' | 'projectManagerName'; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
    
    const { user } = useAuth();
    const { toast } = useToast();

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

                const eventToProjectRaw = sessionStorage.getItem('ogeemo-event-to-project');
                if (eventToProjectRaw) {
                    const eventData = JSON.parse(eventToProjectRaw);
                    setInitialDialogData({ name: eventData.name, description: eventData.description });
                    setIsNewItemDialogOpen(true);
                    sessionStorage.removeItem('ogeemo-event-to-project');
                }
                
                const ideaToProjectRaw = sessionStorage.getItem('ogeemo-idea-to-project');
                if (ideaToProjectRaw) {
                    const ideaData = JSON.parse(ideaToProjectRaw);
                    setInitialDialogData({ name: ideaData.title, description: ideaData.description });
                    setIsNewItemDialogOpen(true);
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
            const newProject = await addProject({ ...projectData, status: 'planning', userId: user.uid, createdAt: new Date() });
            setProjects(prev => [newProject, ...prev]);
            toast({ title: "Project Created", description: `"${newProject.name}" has been successfully created and placed in 'Planning'.` });
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
    
    const handleEditProject = (project: Project) => {
        setProjectToEdit(project);
        setIsNewItemDialogOpen(true);
    };

    const handleDeleteProject = (project: Project) => {
        setProjectToDelete(project);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete || !user) return;
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
    
    const requestSort = (key: 'name' | 'clientName' | 'status' | 'projectManagerName') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedProjects = useMemo(() => {
        const sortableItems = [...projects];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: string;
                let bValue: string;

                if (sortConfig.key === 'clientName') {
                    aValue = contacts.find(c => c.id === a.contactId)?.name || '';
                    bValue = contacts.find(c => c.id === b.contactId)?.name || '';
                } else if (sortConfig.key === 'projectManagerName') {
                    aValue = contacts.find(c => c.id === a.projectManagerId)?.name || '';
                    bValue = contacts.find(c => c.id === b.projectManagerId)?.name || '';
                } else {
                    aValue = a[sortConfig.key] || '';
                    bValue = b[sortConfig.key] || '';
                }

                const comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [projects, contacts, sortConfig]);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full pt-16">
                <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <>
            <NewTaskDialog
                isOpen={isNewItemDialogOpen}
                onOpenChange={(open) => {
                    setIsNewItemDialogOpen(open);
                    if (!open) {
                        setProjectToEdit(null);
                        if (sessionStorage.getItem('ogeemo-idea-to-project')) {
                             sessionStorage.removeItem('ogeemo-idea-to-project');
                        }
                    }
                }}
                onProjectCreate={handleProjectCreated}
                onProjectUpdate={handleProjectUpdated}
                contacts={contacts}
                onContactsChange={setContacts}
                projectToEdit={projectToEdit}
                initialData={initialDialogData}
            />
            
            <div className="p-4 sm:p-6 flex flex-col h-full items-center">
                <ProjectManagementHeader />

                <Card className="w-full max-w-6xl">
                    <CardHeader>
                        <CardTitle>All Projects</CardTitle>
                        <CardDescription>A list of all your active and planning projects.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="border-t">
                            <div className="flex items-center p-4 border-b bg-muted/50">
                                <div className="flex-1 grid grid-cols-4 items-center gap-4">
                                    <div className="col-span-1">
                                        <Button onClick={() => requestSort('name')} variant="ghost" className="font-semibold p-0 h-auto w-full justify-start hover:bg-transparent">Project Title <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                    </div>
                                    <div className="col-span-1">
                                        <Button onClick={() => requestSort('clientName')} variant="ghost" className="font-semibold p-0 h-auto w-full justify-start hover:bg-transparent">Client <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <Button onClick={() => requestSort('projectManagerName')} variant="ghost" className="font-semibold p-0 h-auto hover:bg-transparent">Prj Mngr <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <Button onClick={() => requestSort('status')} variant="ghost" className="font-semibold p-0 h-auto hover:bg-transparent">Status <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                    </div>
                                </div>
                                <div className="pl-4 w-[52px]" />
                            </div>
                            <div>
                                {sortedProjects.length > 0 ? (
                                    sortedProjects.map((p) => (
                                        <ProjectListItem
                                            key={p.id}
                                            project={p}
                                            contacts={contacts}
                                            onEdit={handleEditProject}
                                            onDelete={handleDeleteProject}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center p-16 text-muted-foreground">
                                        <Briefcase className="mx-auto h-12 w-12" />
                                        <p className="mt-4">You haven't created any projects yet.</p>
                                        <p className="text-sm">Click "New Project" to get started.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the project "{projectToDelete?.name}" and all of its associated tasks. This action cannot be undone.
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
