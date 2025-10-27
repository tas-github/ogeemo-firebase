
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Edit, Trash2, LoaderCircle, Briefcase, Plus, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjects, deleteProject, getTasksForProject, addProject, updateProject } from '@/services/project-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { type Project, type Event as TaskEvent, type ProjectStatus } from '@/types/calendar-types';
import { NewTaskDialog } from './NewTaskDialog';
import { ProjectManagementHeader } from './ProjectManagementHeader';

const statusDisplayMap: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  'on-hold': 'On Hold',
  completed: 'Completed',
};

export function ProjectListView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
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
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, toast]);

  const handleEdit = (project: Project) => {
    setProjectToEdit(project);
    setIsNewItemDialogOpen(true);
  };
  
  const handleDelete = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      const tasksToDelete = await getTasksForProject(projectToDelete.id);
      await deleteProject(projectToDelete.id, tasksToDelete.map(t => t.id));
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      toast({ title: "Project Deleted" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    } finally {
      setProjectToDelete(null);
    }
  };

  const handleProjectSave = (savedProject: Project, isEditing: boolean) => {
    if (isEditing) {
      setProjects(prev => prev.map(p => (p.id === savedProject.id ? savedProject : p)));
    } else {
      setProjects(prev => [savedProject, ...prev]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold font-headline text-primary">Project List</h1>
          <p className="text-muted-foreground">A complete list of all your projects.</p>
        </header>
        <ProjectManagementHeader />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map(p => {
                    const client = contacts.find(c => c.id === p.contactId);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link href={`/projects/${p.id}/tasks`} className="hover:underline">
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell>{client?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{statusDisplayMap[p.status || 'planning']}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleEdit(p)}><Edit className="mr-2 h-4 w-4"/>Edit Details</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => router.push(`/projects/${p.id}/tasks`)}><ListChecks className="mr-2 h-4 w-4"/>View Task Board</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDelete(p)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete Project</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <NewTaskDialog
        isOpen={isNewItemDialogOpen}
        onOpenChange={(open) => {
            setIsNewItemDialogOpen(open);
            if (!open) setProjectToEdit(null);
        }}
        onProjectCreate={() => {}} // Not used for creation here
        onProjectUpdate={handleProjectSave}
        contacts={contacts}
        onContactsChange={setContacts}
        projectToEdit={projectToEdit}
      />
      
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the project "{projectToDelete?.name}" and all its associated tasks. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
