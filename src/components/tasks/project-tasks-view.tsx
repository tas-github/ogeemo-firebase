
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { LoaderCircle, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjectById, getTasksForProject, type Project, type Event as TaskEvent, updateTaskPositions, updateProject } from '@/services/project-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { NewProjectDialog } from './NewProjectDialog';
import { TaskColumn } from './TaskColumn';
import { type TaskStatus } from '@/types/calendar';

const statusMap: TaskStatus[] = ['todo', 'inProgress', 'done'];

interface ProjectTasksViewProps {
  projectId: string;
}

export function ProjectTasksView({ projectId }: ProjectTasksViewProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<TaskEvent[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            if (!user || !projectId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [projectData, tasksData, contactsData] = await Promise.all([
                    getProjectById(projectId),
                    getTasksForProject(projectId),
                    getContacts(user.uid),
                ]);
                
                if (!projectData) {
                    toast({ variant: 'destructive', title: 'Project not found' });
                    router.push('/projects');
                    return;
                }

                setProject(projectData);
                setTasks(tasksData);
                setContacts(contactsData);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to load project data', description: error.message });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user, projectId, toast, router]);

    const handleTaskCreated = (newTask: TaskEvent) => {
        setTasks(prev => [...prev, newTask]);
    };

    const handleTaskUpdated = (updatedTask: TaskEvent) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };
    
    const handleTaskDeleted = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleMoveTask = useCallback(async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
        const taskToMove = tasks.find(t => t.id === taskId);
        if (!taskToMove) return;

        const oldStatus = taskToMove.status || 'todo';
        
        // Optimistic UI update
        const optimisticTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        
        const reorder = (list: TaskEvent[], startIndex: number, endIndex: number) => {
            const result = Array.from(list);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return result;
        };
        
        const sourceColumnTasks = optimisticTasks.filter(t => t.status === (newStatus === oldStatus ? newStatus : oldStatus)).sort((a,b) => a.position - b.position);
        const destColumnTasks = optimisticTasks.filter(t => t.status === newStatus).sort((a,b) => a.position - b.position);
        const otherTasks = optimisticTasks.filter(t => t.status !== newStatus && t.status !== oldStatus);
        
        let finalTasks: TaskEvent[];
        const tasksToUpdate: { id: string; position: number; status: TaskStatus }[] = [];

        if (oldStatus === newStatus) {
            const currentPosition = sourceColumnTasks.findIndex(t => t.id === taskId);
            const reordered = reorder(sourceColumnTasks, currentPosition, newPosition);
            reordered.forEach((t, index) => {
                if (t.position !== index) {
                    t.position = index;
                    tasksToUpdate.push({ id: t.id, position: index, status: newStatus });
                }
            });
            finalTasks = [...otherTasks, ...reordered];
        } else {
            const [movedTask] = sourceColumnTasks.splice(sourceColumnTasks.findIndex(t => t.id === taskId), 1);
            movedTask.status = newStatus;
            destColumnTasks.splice(newPosition, 0, movedTask);
            
            sourceColumnTasks.forEach((t, index) => {
                if (t.position !== index) {
                    t.position = index;
                    tasksToUpdate.push({ id: t.id, position: index, status: oldStatus });
                }
            });
            destColumnTasks.forEach((t, index) => {
                if (t.position !== index) {
                    t.position = index;
                    tasksToUpdate.push({ id: t.id, position: index, status: newStatus });
                }
            });

            finalTasks = [...otherTasks, ...sourceColumnTasks, ...destColumnTasks];
        }

        setTasks(finalTasks);
        
        try {
            if (tasksToUpdate.length > 0) {
                 await updateTaskPositions(tasksToUpdate);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to move task', description: error.message });
            setTasks(tasks); // Revert on error
        }

    }, [tasks, toast]);

    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, TaskEvent[]> = {
            todo: [],
            inProgress: [],
            done: [],
        };
        tasks.forEach(task => {
            const status = task.status || 'todo';
            if (grouped[status]) {
                grouped[status].push(task);
            }
        });
        for (const status in grouped) {
            grouped[status as TaskStatus].sort((a, b) => a.position - b.position);
        }
        return grouped;
    }, [tasks]);
    
    const handleProjectUpdated = (updatedProject: Project) => {
        setProject(updatedProject);
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col h-full p-4 sm:p-6">
                <header className="pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold font-headline text-primary">{project.name}</h1>
                            <p className="text-muted-foreground mt-1">{project.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(true)}>
                                <Settings className="mr-2 h-4 w-4" /> Edit Project
                            </Button>
                             <Button asChild>
                                <Link href="/projects">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Projects
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-auto py-4">
                    {statusMap.map(status => (
                        <TaskColumn
                            key={status}
                            status={status}
                            tasks={tasksByStatus[status]}
                            projectId={project.id}
                            onMoveTask={handleMoveTask}
                            onTaskCreated={handleTaskCreated}
                            onTaskUpdated={handleTaskUpdated}
                            onTaskDeleted={handleTaskDeleted}
                        />
                    ))}
                </div>
            </div>
             <NewProjectDialog
                isOpen={isDetailsDialogOpen}
                onOpenChange={setIsDetailsDialogOpen}
                projectToEdit={project}
                contacts={contacts}
                onProjectUpdated={handleProjectUpdated}
                onProjectCreated={() => {}} // Not used in edit mode
            />
        </DndProvider>
    );
}
