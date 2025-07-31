
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { format, set, addHours } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Save, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { type Event as TaskEvent, type Project } from '@/types/calendar';
import { type Contact } from '@/data/contacts';
import { ScrollArea } from '../ui/scroll-area';
import { getProjects, addProject, updateProject, addTask, updateTask } from '@/services/project-service';
import { useAuth } from '@/context/auth-context';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

const eventSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  contactId: z.string().optional(),
  isScheduled: z.boolean().default(false),
  startDate: z.date().optional(),
  startHour: z.string().optional(),
  startMinute: z.string().optional(),
  endDate: z.date().optional(),
  endHour: z.string().optional(),
  endMinute: z.string().optional(),
  projectId: z.string().optional(),
}).refine(data => {
    if (data.isScheduled) {
        return !!data.startDate;
    }
    return true;
}, {
    message: "A start date is required when adding to calendar.",
    path: ["isScheduled"],
});

export type EventFormData = z.infer<typeof eventSchema>;

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreate?: (task: TaskEvent) => void;
  onTaskUpdate?: (task: TaskEvent) => void;
  eventToEdit?: TaskEvent | null;
  contacts?: Contact[];
  defaultValues?: Partial<EventFormData>;
  projectId?: string | null;
}

export function NewTaskDialog({ 
    isOpen, 
    onOpenChange, 
    onTaskCreate,
    onTaskUpdate,
    eventToEdit, 
    contacts = [],
    defaultValues = {},
    projectId: defaultProjectId,
}: NewTaskDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });
  
  useEffect(() => {
    if (isOpen) {
      const initialValues = {
        title: eventToEdit?.title || defaultValues.title || '',
        description: eventToEdit?.description || defaultValues.description || '',
        projectId: eventToEdit?.projectId || defaultProjectId || defaultValues.projectId,
        isScheduled: eventToEdit?.start ? true : defaultValues.isScheduled || false,
        startDate: eventToEdit?.start || defaultValues.startDate,
        endDate: eventToEdit?.end || defaultValues.endDate,
        startHour: eventToEdit?.start ? String(eventToEdit.start.getHours()) : defaultValues.startHour,
        startMinute: eventToEdit?.start ? String(eventToEdit.start.getMinutes()) : defaultValues.startMinute,
        endHour: eventToEdit?.end ? String(eventToEdit.end.getHours()) : defaultValues.endHour,
        endMinute: eventToEdit?.end ? String(eventToEdit.end.getMinutes()) : defaultValues.endMinute,
      };
      form.reset(initialValues);
    }
  }, [isOpen]);

  useEffect(() => {
    async function loadProjects() {
        if (isOpen && user) {
            const fetchedProjects = await getProjects(user.uid);
            setProjects(fetchedProjects);
        }
    }
    loadProjects();
  }, [isOpen, user]);

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const date = set(new Date(), { hours: i });
    return { value: String(i), label: format(date, 'h a') };
  });

  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minutes = i * 5;
    return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
  });

  async function onSubmit(values: EventFormData) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error' });
        return;
    }
    
    try {
        const startDateTime = values.isScheduled && values.startDate && values.startHour && values.startMinute
            ? set(values.startDate, { hours: parseInt(values.startHour), minutes: parseInt(values.startMinute) })
            : new Date();
        
        const endDateTime = values.isScheduled && values.endDate && values.endHour && values.endMinute
            ? set(values.endDate, { hours: parseInt(values.endHour), minutes: parseInt(values.endMinute) })
            : addHours(startDateTime, 1);

        const taskData = {
            title: values.title,
            description: values.description || "",
            start: startDateTime,
            end: endDateTime,
            status: 'todo' as 'todo',
            position: 0,
            projectId: values.projectId || defaultProjectId || null,
            contactId: values.contactId || null,
            isScheduled: values.isScheduled,
        };

        if (eventToEdit) {
            const updatedTask = { ...eventToEdit, ...taskData };
            await updateTask(eventToEdit.id, taskData);
            if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
            }
            toast({ title: 'Task Updated' });
        } else {
            const newTask = await addTask({ ...taskData, userId: user.uid });
            if (onTaskCreate) {
                onTaskCreate(newTask);
            }
            toast({ title: 'Task Created' });
        }
        
        onOpenChange(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  }
  
  const handleProjectSelection = (projectId: string) => {
      if (projectId === 'new-project') {
          setIsNewProjectDialogOpen(true);
      } else {
          form.setValue('projectId', projectId);
      }
  }

  const handleCreateProject = async () => {
    if (!user || !newProjectName.trim()) return;
    try {
        const newProjectData = { name: newProjectName, userId: user.uid, createdAt: new Date() };
        const newProject = await addProject(newProjectData);
        setProjects(prev => [newProject, ...prev]);
        form.setValue('projectId', newProject.id);
        toast({ title: "Project Created", description: `Project "${newProjectName}" is now selected.` });
    } catch(e: any) { 
        toast({ variant: "destructive", title: "Failed to create project", description: e.message }); 
    }
    finally { 
        setIsNewProjectDialogOpen(false); 
        setNewProjectName(""); 
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b text-center">
            <DialogTitle className="text-primary">{eventToEdit ? 'Edit Task' : 'Create Task'}</DialogTitle>
            <DialogDescription>Add a new task. Check "Add to Calendar" to schedule it.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="space-y-4 pt-4 px-6">
                  <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Task Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  
                   <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select onValueChange={handleProjectSelection} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Assign to a project (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new-project" className="text-primary font-semibold">
                                <Plus className="inline-block mr-2 h-4 w-4" /> New Project...
                              </SelectItem>
                              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                  <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                  
                  <FormField control={form.control} name="isScheduled" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Add to Calendar</FormLabel></div></FormItem> )} />
                  
                  {form.watch('isScheduled') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50 duration-300">
                          <div className="space-y-2">
                              <FormLabel>From</FormLabel>
                              <div className="flex gap-2">
                                  <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex-1"><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                                  <FormField control={form.control} name="startHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                                  <FormField control={form.control} name="startMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <FormLabel>To</FormLabel>
                              <div className="flex gap-2">
                                  <FormField control={form.control} name="endDate" render={({ field }) => ( <FormItem className="flex-1"><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                                  <FormField control={form.control} name="endHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                                  <FormField control={form.control} name="endMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                              </div>
                          </div>
                      </div>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="p-6 border-t">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit"><Save className="mr-2 h-4 w-4"/> {eventToEdit ? 'Save Changes' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

       <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                This will create a new project and select it for this task.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="new-project-name">Project Name</Label>
              <Input 
                id="new-project-name" 
                value={newProjectName} 
                onChange={(e) => setNewProjectName(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject() }} 
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewProjectDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
