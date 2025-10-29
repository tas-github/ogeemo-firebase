
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type Project, type Event as TaskEvent, type ProjectStep } from '@/types/calendar-types';
import { type Contact } from '@/data/contacts';
import { useAuth } from '@/context/auth-context';
import { addProject, addTask, updateTask, updateProject, getTaskById, addProjectWithTasks } from '@/services/project-service';
import { LoaderCircle, Route, Calendar as CalendarIcon } from 'lucide-react';
import { addMinutes, format, parseISO } from 'date-fns';
import { getContacts, type FolderData } from '@/services/contact-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

export const PROJECT_PLAN_SESSION_KEY = 'ogeemo-project-plan-session';


const projectSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  description: z.string().optional(),
  contactId: z.string().optional().nullable(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed']).default('planning'),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  projectValue: z.coerce.number().optional(),
});

const taskSchema = z.object({
    title: z.string().min(2, { message: "Task title is required." }),
    description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;
type TaskFormData = z.infer<typeof taskSchema>;

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectCreate?: (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[]) => void;
  onProjectUpdate?: (project: Project, tasks: []) => void;
  onTaskCreate?: (task: TaskEvent) => void;
  contacts?: Contact[];
  onContactsChange?: (contacts: Contact[]) => void;
  projectToEdit?: Project | null;
  projectId?: string; // If provided, we are in "add task" mode
  initialData?: Partial<any>;
}

export function NewTaskDialog({
  isOpen,
  onOpenChange,
  onProjectCreate,
  onProjectUpdate,
  onTaskCreate,
  contacts = [],
  onContactsChange,
  projectToEdit,
  projectId,
  initialData,
}: NewTaskDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  const isTaskMode = !!projectId;
  const isEditingProject = !!projectToEdit;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", contactId: null, status: 'planning' },
  });

  const taskForm = useForm<TaskFormData>({
      resolver: zodResolver(taskSchema),
      defaultValues: { title: "", description: "" },
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (isTaskMode) {
             taskForm.reset({ title: "", description: "" });
        } else {
            const defaults = projectToEdit 
                ? { 
                    name: projectToEdit.name,
                    description: projectToEdit.description,
                    contactId: projectToEdit.contactId,
                    status: projectToEdit.status,
                    startDate: projectToEdit.startDate ? parseISO(projectToEdit.startDate as unknown as string) : undefined,
                    endDate: projectToEdit.endDate ? parseISO(projectToEdit.endDate as unknown as string) : undefined,
                    projectValue: projectToEdit.projectValue
                  }
                : { ...initialData };
            form.reset(defaults);
        }
    }
  }, [isOpen, projectToEdit, isTaskMode, initialData, form, taskForm]);

  async function onProjectSubmit(values: ProjectFormData) {
    if (!user) return;
    setIsLoading(true);

    if (isEditingProject && projectToEdit) {
        if (onProjectUpdate) {
            onProjectUpdate({ ...projectToEdit, ...values }, []);
        }
    } else {
        if (onProjectCreate) {
            onProjectCreate({ ...values, contactId: values.contactId || null }, []);
        }
    }
    
    setIsLoading(false);
    onOpenChange(false);
  }
  
  const handleOpenProjectOrganizer = async () => {
    if (!user) return;

    // Trigger validation
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    
    // Save or update the project first
    setIsLoading(true);
    try {
      let currentProjectId: string;
      if (projectToEdit) {
        currentProjectId = projectToEdit.id;
        const dataToUpdate = {
            ...values,
            contactId: values.contactId || null,
        };
        await updateProject(currentProjectId, dataToUpdate);
        toast({ title: "Project Saved" });
      } else {
        const newProject = await addProject({ 
            ...values, 
            contactId: values.contactId || null, 
            userId: user.uid, 
            createdAt: new Date()
        });
        currentProjectId = newProject.id;
        toast({ title: "Project Created" });
      }

      // Store data in session storage and navigate
      sessionStorage.setItem(PROJECT_PLAN_SESSION_KEY, JSON.stringify({
        projectData: { ...values, id: currentProjectId },
        steps: projectToEdit?.steps || [],
      }));
      router.push(`/projects/organizer`);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };


  async function onTaskSubmit(values: TaskFormData) {
    if (!user || !projectId) return;

    setIsLoading(true);
    try {
        const newTaskData: Omit<TaskEvent, 'id'> = {
            title: values.title,
            description: values.description,
            start: new Date(),
            end: addMinutes(new Date(), 30),
            status: 'todo',
            position: 0,
            projectId: projectId === 'inbox' ? null : projectId,
            userId: user.uid,
            isScheduled: false,
        };
        const savedTask = await addTask(newTaskData);
        if (onTaskCreate) {
          onTaskCreate(savedTask);
        }
        toast({ title: "Task Created" });
        onOpenChange(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create task', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }

  const renderProjectForm = () => (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onProjectSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{isEditingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
              <DialogDescription>
                {isEditingProject ? "Update the details for this project." : "Start by giving your new project a name and description."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Project Name</FormLabel> <FormControl><Input placeholder="e.g., Q4 Marketing Campaign" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description (Optional)</FormLabel> <FormControl><Textarea placeholder="Describe the main goal of this project" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="contactId" render={({ field }) => ( <FormItem> <FormLabel>Client (Optional)</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Assign a client to this project" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="status" render={({ field }) => ( <FormItem> <FormLabel>Status</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="planning">In Planning</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="on-hold">On-Hold</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select><FormMessage /> </FormItem> )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem> )}/>
                    <FormField control={form.control} name="endDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem> )}/>
                </div>
                <FormField control={form.control} name="projectValue" render={({ field }) => ( <FormItem><FormLabel>Project Value ($)</FormLabel><FormControl><Input type="number" placeholder="Enter estimated project value" {...field} onChange={e => field.onChange(Number(e.target.value))}/></FormControl><FormMessage/></FormItem> )} />
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                <Button type="button" variant="outline" onClick={handleOpenProjectOrganizer} disabled={isLoading}>
                    <Route className="mr-2 h-4 w-4" /> Open Project Organizer
                </Button>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditingProject ? "Save Changes" : "Save Project"}
                    </Button>
                </div>
            </DialogFooter>
        </form>
    </Form>
  );

  const renderTaskForm = () => (
    <Form {...taskForm}>
        <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>
                Add a new task to this project.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <FormField control={taskForm.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input placeholder="e.g., Draft homepage copy" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={taskForm.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description (Optional)</FormLabel> <FormControl><Textarea placeholder="Add more details about the task..." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Add Task
                </Button>
            </DialogFooter>
        </form>
    </Form>
  );

  return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          {isTaskMode ? renderTaskForm() : renderProjectForm()}
        </DialogContent>
      </Dialog>
  );
}
