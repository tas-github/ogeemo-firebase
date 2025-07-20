
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Users, LoaderCircle, MoreVertical, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjects, getTasksForProject, type Project, type Event as TaskEvent, updateTask, updateTaskPositions, addProjectTemplate } from '@/services/project-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { NewProjectDialog } from './NewProjectDialog';
import { ProjectDetailsDialog } from './ProjectDetailsDialog';
import { TaskColumn } from './TaskColumn';
import { type TaskStatus } from '@/types/calendar';
import { NewTaskDialog } from './NewTaskDialog';


const statusMap: TaskStatus[] = ['todo', 'inProgress', 'done'];

function TasksViewContent() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<TaskEvent[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [isProjectDetailsDialogOpen, setIsProjectDetailsDialogOpen] = useState(false);
    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
    
    const { user } = useAuth();
    const { toast } = useToast();

    const loadProjects = useCallback(async (userId: string) => {
        try {
            const fetchedProjects = await getProjects(userId);
            setProjects(fetchedProjects);
            if (fetchedProjects.length > 0 && !selectedProject) {
                const ideaToProjectRaw = sessionStorage.getItem('ogeemo-idea-to-project');
                if (ideaToProjectRaw) {
                    setIsNewProjectDialogOpen(true);
                } else {
                    setSelectedProject(fetchedProjects[0]);
                }
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load projects', description: error.message });
        }
    }, [selectedProject, toast]);

    useEffect(() => {
        async function loadInitialData() {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [fetchedContacts] = await Promise.all([
                    getContacts(user.uid),
                    loadProjects(user.uid)
                ]);
                setContacts(fetchedContacts);
            } catch (error: any) {
                 toast({ variant: 'destructive', title: 'Failed to load initial data', description: error.message });
            } finally {
                setIsLoading(false);
            }
        }
        loadInitialData();
    }, [user, toast, loadProjects]);

    useEffect(() => {
        async function loadTasks() {
            if (selectedProject && user) {
                setIsLoading(true);
                try {
                    const fetchedTasks = await getTasksForProject(selectedProject.id);
                    setTasks(fetchedTasks);
                } catch (error: any) {
                    toast({ variant: 'destructive', title: 'Failed to load tasks', description: error.message });
                } finally {
                    setIsLoading(false);
                }
            } else {
                setTasks([]);
                setIsLoading(false);
            }
        }
        loadTasks();
    }, [selectedProject, user, toast]);

    const handleProjectCreated = (newProject: Project, newTasks: TaskEvent[]) => {
        setProjects(prev => [...prev, newProject]);
        setSelectedProject(newProject);
        setTasks(newTasks);
    };

    const handleTaskCreated = (newTask: TaskEvent) => {
        setTasks(prev => [...prev, newTask]);
    };

    const handleTaskUpdated = (updatedTask: TaskEvent) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleMoveTask = useCallback(async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
        const taskToMove = tasks.find(t => t.id === taskId);
        if (!taskToMove) return;

        const oldStatus = taskToMove.status || 'todo';
        
        // Optimistic UI Update
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
            setTasks(tasks); 
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

    return (
        <div className="p-4 sm:p-6 flex flex-col h-full">
            <header className="text-center mb-6">
                <h1 className="text-3xl font-bold font-headline text-primary">Project Manager</h1>
                <p className="text-muted-foreground">A project is a collection of tasks. Drag tasks to change their status.</p>
            </header>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Select value={selectedProject?.id || ''} onValueChange={(projectId) => setSelectedProject(projects.find(p => p.id === projectId) || null)}>
                        <SelectTrigger className="w-[250px] text-2xl font-semibold h-auto border-0 shadow-none">
                            <SelectValue placeholder="Select a Project..." />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {selectedProject && (
                        <Button variant="ghost" size="icon" onClick={() => setIsProjectDetailsDialogOpen(true)}>
                            <Settings className="h-5 w-5"/>
                        </Button>
                    )}
                </div>
                <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
            </div>

            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : selectedProject ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                        {statusMap.map(status => (
                            <TaskColumn
                                key={status}
                                status={status}
                                tasks={tasksByStatus[status]}
                                onMoveTask={handleMoveTask}
                                projectId={selectedProject.id}
                                onTaskCreated={handleTaskCreated}
                                onTaskUpdated={handleTaskUpdated}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <Card className="w-full max-w-md text-center">
                            <CardHeader>
                                <CardTitle>No Project Selected</CardTitle>
                                <CardDescription>Create a new project or select one to view its tasks.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                )}
            </div>

            <NewProjectDialog
                isOpen={isNewProjectDialogOpen}
                onOpenChange={setIsNewProjectDialogOpen}
                onProjectCreated={handleProjectCreated}
                contacts={contacts}
            />
            {selectedProject && (
                <ProjectDetailsDialog
                    isOpen={isProjectDetailsDialogOpen}
                    onOpenChange={setIsProjectDetailsDialogOpen}
                    project={selectedProject}
                    contacts={contacts}
                    onProjectUpdated={(updatedProject) => {
                        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                        setSelectedProject(updatedProject);
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
