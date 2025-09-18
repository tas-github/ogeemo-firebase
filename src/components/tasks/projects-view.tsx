
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, LoaderCircle, Inbox, MoreVertical, Edit, Trash2, ListChecks, ArrowUpDown, ListTodo } from 'lucide-react';
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
import { cn } from '@/lib/utils';


const emptyInitialData = {};

const statusDisplayMap: Record<string, string> = {
    planning: 'In Planning',
    active: 'Active',
    'on-hold': 'On-Hold',
    completed: 'Completed',
};

const ProjectListItem = ({ project, contacts, onEdit, onDelete }: { project: Project, contacts: Contact[], onEdit: (p: Project) => void, onDelete: (p: Project) => void }) => {
    const client = contacts.find(c => c.id === project.contactId);
    const router = useRouter();

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(project);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(project);
    }

    const projectLink = `/projects/${project.id}/tasks`;

    return (
        <div 
            className="group flex items-center p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => router.push(projectLink)}
        >
            <div className="flex-1 grid grid-cols-12 items-center gap-4">
                <div className="col-span-4">
                    <p className="font-semibold">{project.name}</p>
                </div>
                <div className="col-span-4">
                    <p className="text-sm text-muted-foreground">{client?.name || 'No client assigned'}</p>
                </div>
                <div className="col-span-4 text-center">
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

export function ProjectsView() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
    const [initialDialogData, setInitialDialogData] = useState(emptyInitialData);
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'clientName' | 'status'; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
    
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
    
    const requestSort = (key: 'name' | 'clientName' | 'status') => {
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
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold font-headline text-primary">Project Manager</h1>
                    <p className="text-muted-foreground">Manage your projects, view tasks, or create a new project.</p>
                </header>

                <Card className="w-full max-w-6xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>All Projects</CardTitle>
                            <CardDescription>A list of all your active and planning projects.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button asChild variant="outline">
                                <Link href="/project-status">
                                    <ListChecks className="mr-2 h-4 w-4" />
                                    Project Status
                                </Link>
                            </Button>
                            <Button onClick={() => { setInitialDialogData({}); setProjectToEdit(null); setIsNewItemDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> New Project
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="border-t">
                            <div className="flex items-center p-4 border-b bg-muted/50">
                                <div className="flex-1 grid grid-cols-12 items-center gap-4">
                                    <div className="col-span-4">
                                        <Button onClick={() => requestSort('name')} className="font-semibold p-2 h-auto w-full justify-center bg-gradient-to-r from-glass-start to-glass-end text-black shadow-glass hover:from-glass-start/90 hover:to-glass-end/90">Project Title <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                    </div>
                                    <div className="col-span-4">
                                        <Button onClick={() => requestSort('clientName')} className="font-semibold p-2 h-auto w-full justify-center bg-gradient-to-r from-glass-start to-glass-end text-black shadow-glass hover:from-glass-start/90 hover:to-glass-end/90">Client <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                    </div>
                                    <div className="col-span-4">
                                        <Button onClick={() => requestSort('status')} className="font-semibold p-2 h-auto w-full justify-center bg-gradient-to-r from-glass-start to-glass-end text-black shadow-glass hover:from-glass-start/90 hover:to-glass-end/90">Status <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
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
