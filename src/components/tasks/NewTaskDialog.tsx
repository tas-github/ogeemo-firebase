
"use client";

import * as React from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { format, set, addHours } from 'date-fns';
import { type DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Save, Plus, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { type Event as TaskEvent, type Project } from '@/types/calendar-types';
import { type Contact } from '@/data/contacts';
import { ScrollArea } from '../ui/scroll-area';
import { getProjects, addProject, updateProject, addTask, updateTask } from '@/services/project-service';
import { useAuth } from '@/context/auth-context';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


const eventSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  contactId: z.string().optional(),
  isScheduled: z.boolean().default(false),
  dateRange: z.custom<DateRange>().optional(),
  startTime: z.string().optional(), // HH:mm format
  endTime: z.string().optional(), // HH:mm format
  projectId: z.string().optional(),
}).refine(data => {
    if (data.isScheduled) {
        return !!data.dateRange?.from && !!data.startTime && !!data.endTime;
    }
    return true;
}, {
    message: "A date range and start/end times are required when scheduling.",
    path: ["isScheduled"],
});

export type EventFormData = z.infer<typeof eventSchema>;

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreate?: (task: TaskEvent) => void;
  onTaskUpdate?: (task: TaskEvent) => void;
  onProjectCreate?: (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: []) => void;
  onProjectUpdate?: (project: Project) => void;
  eventToEdit?: TaskEvent | null;
  projectToEdit?: Project | null;
  contacts?: Contact[];
  defaultValues?: Partial<EventFormData>;
  initialMode?: 'project' | 'task';
  initialData?: any;
  projectId?: string | null;
}

export function NewTaskDialog({ 
    isOpen, 
    onOpenChange, 
    onTaskCreate,
    onTaskUpdate,
    onProjectCreate,
    onProjectUpdate,
    eventToEdit,
    projectToEdit, 
    contacts = [],
    defaultValues = {},
    initialMode = 'task',
    initialData,
    projectId: defaultProjectId,
}: NewTaskDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [mode, setMode] = React.useState<'project' | 'task'>(initialMode);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState("");
  const [isContactPopoverOpen, setIsContactPopoverOpen] = React.useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });
  
  React.useEffect(() => {
    if (isOpen) {
        const modeToUse = projectToEdit ? 'project' : initialMode;
        setMode(modeToUse);

        const values = {
            title: projectToEdit?.name || eventToEdit?.title || defaultValues.title || initialData?.title || '',
            description: projectToEdit?.description || eventToEdit?.description || defaultValues.description || initialData?.description || '',
            projectId: eventToEdit?.projectId || defaultProjectId || defaultValues.projectId,
            isScheduled: eventToEdit?.start ? true : defaultValues.isScheduled || false,
            dateRange: eventToEdit?.start ? { from: eventToEdit.start, to: eventToEdit.end } : defaultValues.dateRange,
            startTime: eventToEdit?.start ? format(eventToEdit.start, 'HH:mm') : defaultValues.startTime || '09:00',
            endTime: eventToEdit?.end ? format(eventToEdit.end, 'HH:mm') : defaultValues.endTime || '10:00',
            contactId: eventToEdit?.contactId || defaultValues.contactId,
        };
        form.reset(values);

        if (initialData?.title) {
            sessionStorage.removeItem('ogeemo-idea-to-project');
        }
    }
  }, [isOpen, projectToEdit, eventToEdit, defaultValues, initialMode, defaultProjectId, form]);

  React.useEffect(() => {
    async function loadProjects() {
        if (isOpen && user) {
            const fetchedProjects = await getProjects(user.uid);
            setProjects(fetchedProjects);
        }
    }
    loadProjects();
  }, [isOpen, user]);

  async function onSubmit(values: EventFormData) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error' });
        return;
    }
    
    try {
        if (mode === 'project') {
             const projectData = {
                name: values.title,
                description: values.description || '',
                clientId: values.contactId || null,
             };
             if (projectToEdit) {
                 await onProjectUpdate?.({ ...projectToEdit, ...projectData});
             } else {
                 await onProjectCreate?.(projectData as Omit<Project, 'id' | 'createdAt' | 'userId'>, []);
             }
        } else {
            let startDateTime: Date | undefined = undefined;
            let endDateTime: Date | undefined = undefined;

            if (values.isScheduled && values.dateRange?.from && values.startTime && values.endTime) {
                const [startHour, startMinute] = values.startTime.split(':').map(Number);
                const [endHour, endMinute] = values.endTime.split(':').map(Number);
                
                startDateTime = set(values.dateRange.from, { hours: startHour, minutes: startMinute });
                endDateTime = set(values.dateRange.to || values.dateRange.from, { hours: endHour, minutes: endMinute });
            }

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
                await onTaskUpdate?.(updatedTask);
            } else {
                const newTask = await addTask({ ...taskData, userId: user.uid });
                onTaskCreate?.(newTask);
            }
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
  
  const isProjectMode = mode === 'project';
  const isCalendarMode = defaultValues.isScheduled === true;

  const getDialogTitle = () => {
    if (projectToEdit) return 'Edit Project';
    if (eventToEdit) return 'Edit Task';
    if (isProjectMode) return 'Create Project';
    if (isCalendarMode) return 'Create Calendar Event';
    return 'Create Task';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b text-center sm:text-center">
            <DialogTitle className="text-primary">{getDialogTitle()}</DialogTitle>
            <DialogDescription>{isProjectMode ? "Define your new project." : 'Add a new task. Check "Add to Calendar" to schedule it.'}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="space-y-6 pt-4 px-6">
                  {/* Details Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Details</h3>
                    <div className="space-y-4">
                      <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>{isProjectMode ? 'Project Name' : 'Task Title'}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="contactId"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Client / Contact</FormLabel>
                                <Popover open={isContactPopoverOpen} onOpenChange={setIsContactPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                        {field.value ? contacts.find((c) => c.id === field.value)?.name : "Select a Contact..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                    <CommandInput placeholder="Search contacts..." />
                                    <CommandList>
                                        <CommandEmpty>No contact found.</CommandEmpty>
                                        <CommandGroup>
                                        {contacts.map((contact) => (
                                            <CommandItem
                                                value={contact.name}
                                                key={contact.id}
                                                onSelect={() => {
                                                    form.setValue("contactId", contact.id);
                                                    setIsContactPopoverOpen(false);
                                                }}
                                            >
                                            <Check className={cn("mr-2 h-4 w-4", contact.id === field.value ? "opacity-100" : "opacity-0")} />
                                                {contact.name}
                                            </CommandItem>
                                        ))}
                                         <CommandItem onSelect={() => toast({ title: 'Placeholder', description: 'This would open a "New Contact" form.' })}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create a new contact
                                        </CommandItem>
                                        </CommandGroup>
                                    </CommandList>
                                    </Command>
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {!isProjectMode && (
                          <FormField control={form.control} name="projectId" render={({ field }) => (
                          <FormItem><FormLabel>Project</FormLabel><Select onValueChange={handleProjectSelection} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Assign to a project (optional)" /></SelectTrigger></FormControl><SelectContent><SelectItem value="new-project" className="text-primary font-semibold"><Plus className="inline-block mr-2 h-4 w-4" /> New Project...</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                          )} />
                        )}
                      </div>
                      <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                  </div>

                  {!isProjectMode && (
                    <>
                      <Separator />
                      {/* Scheduling Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Scheduling</h3>
                        <FormField control={form.control} name="isScheduled" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Add to Calendar</FormLabel></div></FormItem> )} />
                        
                        {form.watch('isScheduled') && (
                          <div className="mt-4 space-y-4 animate-in fade-in-50 duration-300">
                            <FormField
                              control={form.control}
                              name="dateRange"
                              render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date Range</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value?.from ? ( field.value.to ? `${format(field.value.from, "LLL dd, y")} - ${format(field.value.to, "LLL dd, y")}` : format(field.value.from, "LLL dd, y")) : <span>Pick a date range</span>}
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="range" selected={field.value} onSelect={field.onChange} initialFocus/>
                                        </PopoverContent>
                                    </Popover>
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="startTime" render={({ field }) => ( <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name="endTime" render={({ field }) => ( <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem> )} />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="p-6 border-t">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit"><Save className="mr-2 h-4 w-4"/> {projectToEdit || eventToEdit ? 'Save Changes' : 'Create'}</Button>
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
