
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle, ArrowLeft, Route, Calendar, Inbox, Trash2, Plus } from 'lucide-react';
import { TaskColumn } from './TaskColumn';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjectById, getTasksForProject, getTasksForUser, addTask, updateTask, updateTaskPositions, deleteTask, deleteTasks } from '@/services/project-service';
import { type Project, type Event as TaskEvent, type TaskStatus } from '@/types/calendar';
import { getContacts, type Contact } from '@/services/contact-service';
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog';
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

export const ACTION_ITEMS_PROJECT_ID = 'inbox';


const defaultDialogValues = {};

export function ProjectTasksView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<TaskEvent[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
    const lastSelectedTaskIndex = useRef<number | null>(null);
    
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const isActionItemsView = projectId === ACTION_ITEMS_PROJECT_ID;

    const loadData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            let projectData: Project | null;
            let tasksData: TaskEvent[];
            
            if (isActionItemsView) {
                projectData = {
                    id: ACTION_ITEMS_PROJECT_ID,
                    name: "Action Items",
                    description: "A place for all your uncategorized tasks.",
                    userId: user.uid,
                    createdAt: new Date(),
                };
                const allUserTasks = await getTasksForUser(user.uid);
                tasksData = allUserTasks.filter(task => !task.projectId || task.projectId === ACTION_ITEMS_PROJECT_ID);
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
    }, [projectId, isActionItemsView, user, router, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const sortedTasksForShiftClick = useMemo(() => {
        const todo = tasks.filter(t => t.status === 'todo').sort((a,b) => a.position - b.position);
        const inProgress = tasks.filter(t => t.status === 'inProgress').sort((a,b) => a.position - b.position);
        const done = tasks.filter(t => t.status === 'done').sort((a,b) => a.position - b.position);
        return [...todo, ...inProgress, ...done];
    }, [tasks]);

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

    const handleTaskUpdated = (updatedTask: TaskEvent) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleTaskDeleted = async (taskId: string) => {
        const originalTasks = [...tasks];
        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            await deleteTask(taskId);
            toast({ title: "Task Deleted" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
            setTasks(originalTasks);
        }
    };
    
    const handleDeleteSelected = async () => {
        if (selectedTaskIds.length === 0) return;
        
        const originalTasks = [...tasks];
        setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)));

        try {
            await deleteTasks(selectedTaskIds);
            toast({ title: `${selectedTaskIds.length} Task(s) Deleted` });
            setSelectedTaskIds([]);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Bulk Delete Failed', description: error.message });
            setTasks(originalTasks);
        } finally {
            setIsBulkDeleteAlertOpen(false);
        }
    };
    
    const handleToggleSelect = (taskId: string, event?: React.MouseEvent) => {
        const currentIndex = sortedTasksForShiftClick.findIndex(t => t.id === taskId);

        if (event?.shiftKey && lastSelectedTaskIndex.current !== null) {
            const start = Math.min(lastSelectedTaskIndex.current, currentIndex);
            const end = Math.max(lastSelectedTaskIndex.current, currentIndex);
            const rangeIds = sortedTasksForShiftClick.slice(start, end + 1).map(t => t.id);
            
            const currentTaskIsSelected = selectedTaskIds.includes(taskId);

            if (currentTaskIsSelected) {
                 setSelectedTaskIds(prev => prev.filter(id => !rangeIds.includes(id)));
            } else {
                 setSelectedTaskIds(prev => [...new Set([...prev, ...rangeIds])]);
            }
        } else {
            setSelectedTaskIds((prev) =>
              prev.includes(taskId)
                ? prev.filter((id) => id !== taskId)
                : [...prev, taskId]
            );
            lastSelectedTaskIndex.current = currentIndex;
        }
    };

    const handleToggleSelectAll = (status: TaskStatus) => {
        const columnTaskIds = tasksByStatus[status].map(t => t.id);
        const allSelected = columnTaskIds.every(id => selectedTaskIds.includes(id));

        if (allSelected) {
            setSelectedTaskIds(prev => prev.filter(id => !columnTaskIds.includes(id)));
        } else {
            setSelectedTaskIds(prev => [...new Set([...prev, ...columnTaskIds])]);
        }
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
                <header className="flex flex-col items-center text-center pb-4">
                     <div>
                        <h1 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
                            {isActionItemsView ? (
                                <>
                                    <Inbox className="h-6 w-6" />
                                    Task Board Action Items
                                </>
                            ) : (
                                project.name
                            )}
                        </h1>
                        <p className="text-muted-foreground">
                            {isActionItemsView
                                ? "Manage your task action items here."
                                : "Manage your project tasks on the Kanban board."
                            }
                        </p>
                     </div>
                     <div className="flex items-center gap-2 mt-4">
                        <Button
                            onClick={() => setIsBulkDeleteAlertOpen(true)}
                            disabled={selectedTaskIds.length === 0}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Bulk Delete
                        </Button>
                        <Button onClick={handleAddTask} variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Task
                        </Button>
                        {!isActionItemsView && (
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
                        selectedTaskIds={selectedTaskIds}
                        onToggleSelect={handleToggleSelect}
                        onToggleSelectAll={handleToggleSelectAll}
                    />
                    <TaskColumn
                        status="inProgress"
                        tasks={tasksByStatus.inProgress}
                        onAddTask={handleAddTask}
                        onMoveTask={handleMoveTask}
                        onTaskUpdate={handleTaskUpdated}
                        onTaskDelete={handleTaskDeleted}
                        selectedTaskIds={selectedTaskIds}
                        onToggleSelect={handleToggleSelect}
                        onToggleSelectAll={handleToggleSelectAll}
                    />
                    <TaskColumn
                        status="done"
                        tasks={tasksByStatus.done}
                        onAddTask={handleAddTask}
                        onMoveTask={handleMoveTask}
                        onTaskUpdate={handleTaskUpdated}
                        onTaskDelete={handleTaskDeleted}
                        selectedTaskIds={selectedTaskIds}
                        onToggleSelect={handleToggleSelect}
                        onToggleSelectAll={handleToggleSelectAll}
                    />
                </div>
            </div>
            <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete {selectedTaskIds.length} selected task(s). This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSelected}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
