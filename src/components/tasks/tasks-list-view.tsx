
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Briefcase, Calendar, ListTodo, Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjects, getTasksForUser, updateTask, type Project } from '@/services/project-service';
import { type Event as TaskEvent } from '@/types/calendar';
import { getContacts, type Contact } from '@/services/contact-service';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '../ui/button';
import Link from 'next/link';
import { NewTaskDialog, type EventFormData } from './NewTaskDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TaskListItem = ({ task, onToggle }: { task: TaskEvent, onToggle: (task: TaskEvent) => void }) => (
    <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
        <Checkbox 
            checked={task.status === 'done'}
            onCheckedChange={() => onToggle(task)}
            className="mt-1"
            id={`task-${task.id}`}
        />
        <div className="flex-1">
            <label htmlFor={`task-${task.id}`} className="font-medium cursor-pointer">{task.title}</label>
            <p className="text-sm text-muted-foreground">{task.description}</p>
            {task.isScheduled && task.start && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {format(task.start, 'PP')}
                </p>
            )}
        </div>
    </div>
);

const ProjectTaskList = ({ project, tasks, onToggle }: { project: Project, tasks: TaskEvent[], onToggle: (task: TaskEvent) => void }) => {
    if (tasks.length === 0) return null;

    return (
        <AccordionItem value={project.id}>
            <AccordionTrigger>
                <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <div className="text-left">
                        <p className="font-semibold">{project.name}</p>
                        <p className="text-sm font-normal text-muted-foreground">{tasks.length} task(s)</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="pl-8 pr-2 space-y-2">
                    {tasks.map(task => <TaskListItem key={task.id} task={task} onToggle={onToggle} />)}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

const defaultDialogValues = {};

export function TasksListView() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<TaskEvent[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
    const [dialogDefaultValues, setDialogDefaultValues] = useState<Partial<EventFormData>>(defaultDialogValues);
    const { user } = useAuth();
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [fetchedProjects, fetchedTasks, fetchedContacts] = await Promise.all([
                getProjects(user.uid),
                getTasksForUser(user.uid),
                getContacts(user.uid),
            ]);
            setProjects(fetchedProjects);
            setTasks(fetchedTasks);
            setContacts(fetchedContacts);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load tasks', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const { scheduledTasks, unscheduledTasks } = useMemo(() => {
        const scheduled = tasks.filter(t => t.isScheduled).sort((a,b) => a.start.getTime() - b.start.getTime());
        const unscheduled = tasks.filter(t => !t.isScheduled).sort((a,b) => a.start.getTime() - b.start.getTime());
        return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
    }, [tasks]);

    const tasksByProject = useMemo(() => {
        const grouped: Record<string, TaskEvent[]> = {};
        projects.forEach(p => { grouped[p.id] = []; });
        tasks.forEach(task => {
            if (task.projectId && grouped[task.projectId]) {
                grouped[task.projectId].push(task);
            }
        });
        return grouped;
    }, [tasks, projects]);

    const handleTaskCompletion = async (task: TaskEvent) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        const updatedTask = { ...task, status: newStatus };
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        try {
            await updateTask(task.id, { status: newStatus });
        } catch (error) {
            setTasks(prev => prev.map(t => t.id === task.id ? task : t));
            toast({ variant: 'destructive', title: 'Failed to update task' });
        }
    };
    
    const handleDialogClose = (open: boolean) => {
        setIsNewTaskDialogOpen(open);
        if (!open) {
            loadData();
        }
    };
    
    const handleOpenDialog = (defaults: Partial<EventFormData>) => {
        setDialogDefaultValues(defaults);
        setIsNewTaskDialogOpen(true);
    };

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <>
        <div className="p-4 sm:p-6 flex flex-col h-full items-center">
            <header className="text-center mb-6">
                <h1 className="text-3xl font-bold font-headline text-primary">Task List</h1>
                <p className="text-muted-foreground">A unified list of all your tasks and scheduled events.</p>
            </header>

            <Card className="w-full max-w-4xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Task Dashboard</CardTitle>
                        <CardDescription>View your projects and tasks in organized lists.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog({})}>
                        <Plus className="mr-2 h-4 w-4" /> New Task
                    </Button>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="projects" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                            <TabsTrigger value="unscheduled">Unscheduled</TabsTrigger>
                            <TabsTrigger value="all">All Tasks</TabsTrigger>
                        </TabsList>
                        <TabsContent value="projects" className="mt-4">
                            {projects.map(project => (
                                <Link href={`/projects/${project.id}/tasks`} key={project.id}>
                                    <div className="flex items-center gap-3 p-3 rounded-md hover:bg-accent/50">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="font-semibold">{project.name}</p>
                                            <p className="text-sm font-normal text-muted-foreground">{(tasksByProject[project.id] || []).length} task(s)</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </TabsContent>
                        <TabsContent value="scheduled">
                            <Accordion type="multiple" className="w-full">
                                {projects.map(p => <ProjectTaskList key={p.id} project={p} tasks={scheduledTasks.filter(t => t.projectId === p.id)} onToggle={handleTaskCompletion} />)}
                            </Accordion>
                        </TabsContent>
                        <TabsContent value="unscheduled">
                             <Accordion type="multiple" className="w-full">
                                {projects.map(p => <ProjectTaskList key={p.id} project={p} tasks={unscheduledTasks.filter(t => t.projectId === p.id)} onToggle={handleTaskCompletion} />)}
                            </Accordion>
                        </TabsContent>
                        <TabsContent value="all">
                             <Accordion type="multiple" className="w-full">
                                {projects.map(p => <ProjectTaskList key={p.id} project={p} tasks={tasks.filter(t => t.projectId === p.id)} onToggle={handleTaskCompletion} />)}
                            </Accordion>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
        <NewTaskDialog
            isOpen={isNewTaskDialogOpen}
            onOpenChange={handleDialogClose}
            contacts={contacts}
            defaultValues={dialogDefaultValues}
        />
        </>
    );
}
