
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoaderCircle, ArrowLeft, Plus } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getProjectById, getTasksForProject, updateTaskPositions, type Project, type Event as TaskEvent, type TaskStatus } from '@/services/project-service';
import { TaskColumn } from './TaskColumn';
import { NewTaskDialog } from './NewTaskDialog';

export function ProjectTasksView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<TaskEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
    const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');

    const { toast } = useToast();
    const router = useRouter();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedProject, fetchedTasks] = await Promise.all([
                getProjectById(projectId),
                getTasksForProject(projectId),
            ]);
            
            if (fetchedProject) {
                setProject(fetchedProject);
                setTasks(fetchedTasks.sort((a, b) => a.position - b.position));
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find the specified project.' });
                router.push('/projects');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load project data', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [projectId, router, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleTaskCreated = (newTask: TaskEvent) => {
        setTasks(prev => [...prev, newTask]);
    };

    const handleTaskUpdated = (updatedTask: TaskEvent) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleTaskDelete = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
        const originalTasks = tasks;
        const taskToMove = tasks.find(t => t.id === taskId);
        if (!taskToMove) return;

        // Optimistic UI Update
        const updatedTasks = tasks
            .filter(t => t.id !== taskId)
            .concat({ ...taskToMove, status: newStatus })
            .map(t => {
                if (t.status === newStatus && t.position >= newPosition) {
                    return { ...t, position: t.position + 1 };
                }
                return t;
            })
            .map(t => t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t)
            .sort((a, b) => a.position - b.position);
            
        setTasks(updatedTasks);
        
        const tasksToUpdate = updatedTasks
            .filter(t => t.status === newStatus)
            .map((task, index) => ({ id: task.id, position: index, status: newStatus }));

        try {
            await updateTaskPositions(tasksToUpdate);
        } catch (error) {
            setTasks(originalTasks); // Revert on failure
            toast({ variant: 'destructive', title: 'Failed to move task' });
        }

    }, [tasks, toast]);
    

    const handleOpenNewTaskDialog = (status: TaskStatus) => {
        setNewTaskStatus(status);
        setIsNewTaskDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!project) return null;
    
    const columns: TaskStatus[] = ['todo', 'inProgress', 'done'];

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="p-4 sm:p-6 flex flex-col h-full">
                <header className="flex-shrink-0 mb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold font-headline text-primary">{project.name}</h1>
                            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
                        </div>
                        <Button asChild>
                            <Link href="/projects">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to All Projects
                            </Link>
                        </Button>
                    </div>
                </header>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto">
                    {columns.map(status => (
                        <TaskColumn
                            key={status}
                            status={status}
                            tasks={tasks.filter(t => t.status === status)}
                            onAddTask={() => handleOpenNewTaskDialog(status)}
                            onMoveTask={moveTask}
                            onTaskUpdate={handleTaskUpdated}
                            onTaskDelete={handleTaskDelete}
                        />
                    ))}
                </div>
            </div>

            <NewTaskDialog
                isOpen={isNewTaskDialogOpen}
                onOpenChange={setIsNewTaskDialogOpen}
                onTaskCreate={handleTaskCreated}
                projectId={projectId}
                defaultStatus={newTaskStatus}
            />
        </DndProvider>
    );
}
