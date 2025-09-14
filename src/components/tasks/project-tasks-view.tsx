
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle, ArrowLeft, Route, Calendar, Inbox } from 'lucide-react';
import { TaskColumn } from './TaskColumn';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjectById, getTasksForProject, getTasksForUser, addTask, updateTask, updateTaskPositions } from '@/services/project-service';
import { type Project, type Event as TaskEvent, type TaskStatus } from '@/types/calendar';
import { getContacts, type Contact } from '@/services/contact-service';
import { NewTaskDialog } from './NewTaskDialog';
import { INBOX_PROJECT_ID } from './tasks-view';

const defaultDialogValues = {};

export function ProjectTasksView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<TaskEvent[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
    
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const isInboxView = projectId === INBOX_PROJECT_ID;

    const loadData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            let projectData: Project | null;
            let tasksData: TaskEvent[];
            
            if (isInboxView) {
                projectData = {
                    id: INBOX_PROJECT_ID,
                    name: "Inbox",
                    description: "A place for all your uncategorized tasks.",
                    userId: user.uid,
                    createdAt: new Date(),
                };
                // For inbox, we fetch all tasks that are NOT assigned to a project.
                const allUserTasks = await getTasksForUser(user.uid);
                tasksData = allUserTasks.filter(task => !task.projectId);
            } else {
                [projectData, tasksData] = await Promise.all([
                    getProjectById(projectId),
                    getTasksForProject(projectId),
                ]);
            }
            
            if (!projectData) {
                toast({ variant: 'destructive', title: 'Error', description: 'Project not found.' });
                router.push('/projects');
                return;
            }

            const contactsData = await getContacts(user.uid);

            setProject(projectData);
            setTasks(tasksData);
            setContacts(contactsData);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load project data', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [projectId, isInboxView, user, router, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const tasksByStatus = useMemo(() => {
        const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);
        return {
            todo: sortedTasks.filter(t => t.status === 'todo'),
            inProgress: sortedTasks.filter(t => t.status === 'inProgress'),
            done: sortedTasks.filter(t => t.status === 'done'),
        };
    }, [tasks]);

    const handleAddTask = () => {
        router.push(`/time?projectId=${projectId}`);
    };

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
        if (!taskToMove || (taskToMove.status === newStatus && taskToMove.position === newPosition)) {
            return;
        }

        const tasksInNewColumn = tasks.filter(t => t.status === newStatus).sort((a,b) => a.position - b.position);
        tasksInNewColumn.splice(newPosition, 0, { ...taskToMove, status: newStatus });
        
        const tasksToUpdate = tasksInNewColumn.map((task, index) => ({
            id: task.id,
            position: index,
            status: newStatus,
        }));

        setTasks(prev => {
            const otherTasks = prev.filter(t => t.status !== newStatus && t.id !== taskId);
            return [...otherTasks, ...tasksInNewColumn.map((t, index) => ({...t, position: index}))];
        });

        try {
            await updateTaskPositions(tasksToUpdate);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to move task', description: 'Reverting local changes.' });
            loadData(); // Revert on failure
        }
    }, [tasks, loadData, toast]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!project) {
        return null;
    }

    return (
        <>
            <div className="p-4 sm:p-6 h-full flex flex-col">
                <header className="flex items-center justify-between pb-4">
                     <div>
                        <h1 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
                            {isInboxView && <Inbox className="h-6 w-6" />}
                            {project.name}
                        </h1>
                        <p className="text-muted-foreground">Manage your project tasks on the Kanban board.</p>
                     </div>
                     <div className="flex items-center gap-2">
                        {!isInboxView && (
                            <>
                                <Button asChild variant="outline">
                                    <Link href={`/calendar?projectId=${projectId}`}>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Calendar View
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={`/projects/${projectId}/planning`}>
                                        <Route className="mr-2 h-4 w-4" />
                                        Planning View
                                    </Link>
                                </Button>
                            </>
                        )}
                        <Button asChild variant="outline">
                            <Link href="/projects">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                All Projects
                            </Link>
                        </Button>
                     </div>
                </header>
                
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <TaskColumn
                        status="todo"
                        tasks={tasksByStatus.todo}
                        onAddTask={handleAddTask}
                        onMoveTask={handleMoveTask}
                        onTaskUpdate={handleTaskUpdated}
                        onTaskDelete={handleTaskDeleted}
                    />
                    <TaskColumn
                        status="inProgress"
                        tasks={tasksByStatus.inProgress}
                        onAddTask={handleAddTask}
                        onMoveTask={handleMoveTask}
                        onTaskUpdate={handleTaskUpdated}
                        onTaskDelete={handleTaskDeleted}
                    />
                    <TaskColumn
                        status="done"
                        tasks={tasksByStatus.done}
                        onAddTask={handleAddTask}
                        onMoveTask={handleMoveTask}
                        onTaskUpdate={handleTaskUpdated}
                        onTaskDelete={handleTaskDeleted}
                    />
                </div>
            </div>
            <NewTaskDialog
                isOpen={isNewTaskDialogOpen}
                onOpenChange={setIsNewTaskDialogOpen}
                onTaskCreate={handleTaskCreated}
                projectId={projectId}
                contacts={contacts}
                defaultValues={defaultDialogValues}
            />
        </>
    );
}
