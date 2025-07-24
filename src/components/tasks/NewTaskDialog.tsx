
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { format, set, parseISO } from 'date-fns';

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
import { Calendar as CalendarIcon, Save, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { type Event, type Project } from '@/types/calendar';
import { type Contact } from '@/services/contact-service';

const eventSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  contactId: z.string().optional(),
  startDate: z.date({ required_error: "A start date is required." }),
  startHour: z.string().optional(),
  startMinute: z.string().optional(),
  endDate: z.date({ required_error: "An end date is required." }),
  endHour: z.string().optional(),
  endMinute: z.string().optional(),
  // Project-specific fields
  isProject: z.boolean().default(false),
  clientId: z.string().optional(),
  ownerId: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreate?: (taskData: Omit<Event, 'id' | 'userId'>) => void;
  onTaskUpdate?: (taskData: Event) => void;
  onProjectCreate?: (project: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: []) => void;
  eventToEdit?: Event | null;
  projectToEdit?: Project | null;
  projectId?: string | null;
  contacts?: Contact[];
  initialMode?: 'event' | 'project';
  initialData?: Partial<EventFormData>;
}

export function NewTaskDialog({ 
    isOpen, 
    onOpenChange, 
    onTaskCreate, 
    onTaskUpdate,
    onProjectCreate,
    eventToEdit, 
    projectToEdit,
    projectId, 
    contacts = [],
    initialMode = 'event',
    initialData = {},
}: NewTaskDialogProps) {
  const { toast } = useToast();
  const [isProjectMode, setIsProjectMode] = useState(initialMode === 'project' || !!projectToEdit);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  useEffect(() => {
    if (isOpen) {
        setIsProjectMode(initialMode === 'project' || !!projectToEdit);
        if (projectToEdit) {
            form.reset({
                isProject: true,
                title: projectToEdit.name,
                description: projectToEdit.description || "",
                clientId: projectToEdit.clientId || "",
                ownerId: projectToEdit.ownerId || "",
                startDate: projectToEdit.startDate || new Date(),
                endDate: projectToEdit.dueDate || new Date(),
            });
        } else if (eventToEdit) {
            form.reset({
                isProject: false,
                title: eventToEdit.title,
                description: eventToEdit.description || "",
                contactId: eventToEdit.contactId || "",
                startDate: eventToEdit.start,
                startHour: String(eventToEdit.start.getHours()),
                startMinute: String(eventToEdit.start.getMinutes()),
                endDate: eventToEdit.end,
                endHour: String(eventToEdit.end.getHours()),
                endMinute: String(eventToEdit.end.getMinutes()),
            });
        } else {
            const now = new Date();
            const startOfNextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
            const ideaDataRaw = sessionStorage.getItem('ogeemo-idea-to-project');
            let ideaData = null;
            if (ideaDataRaw) {
              ideaData = JSON.parse(ideaDataRaw);
              sessionStorage.removeItem('ogeemo-idea-to-project');
            }

            form.reset({
                isProject: initialMode === 'project' || !!ideaData,
                title: initialData?.title || ideaData?.title || "",
                description: initialData?.description || ideaData?.description || "",
                contactId: "",
                startDate: initialData?.startDate || now,
                startHour: initialData?.startHour || String(now.getHours()),
                startMinute: initialData?.startMinute || String(now.getMinutes()),
                endDate: initialData?.endDate || startOfNextHour,
                endHour: initialData?.endHour || String(startOfNextHour.getHours()),
                endMinute: initialData?.endMinute || String(startOfNextHour.getMinutes()),
                ...initialData,
            });
        }
    }
  }, [isOpen, eventToEdit, projectToEdit, initialMode, initialData, form.reset]);

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const date = set(new Date(), { hours: i });
    return { value: String(i), label: format(date, 'h a') };
  });

  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minutes = i * 5;
    return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
  });

  async function onSubmit(values: EventFormData) {
    if (isProjectMode) {
        // Handle Project saving
        if (onProjectCreate) { // This is simplified, should handle update too
             const projectData: Omit<Project, 'id' | 'createdAt' | 'userId'> = {
                name: values.title,
                description: values.description,
                clientId: values.clientId || null,
                ownerId: values.ownerId || null,
                assigneeIds: [],
                startDate: values.startDate,
                dueDate: values.endDate,
             };
             onProjectCreate(projectData, []);
        }
    } else {
        // Handle Event/Task saving
        const finalStartDate = set(values.startDate, {
            hours: parseInt(values.startHour!),
            minutes: parseInt(values.startMinute!)
        });

        const finalEndDate = set(values.endDate, {
            hours: parseInt(values.endHour!),
            minutes: parseInt(values.endMinute!)
        });

        if (finalEndDate <= finalStartDate) {
            toast({ variant: "destructive", title: "Invalid Dates", description: "End date and time must be after the start date and time." });
            return;
        }

        const eventData = {
          title: values.title,
          description: values.description,
          start: finalStartDate,
          end: finalEndDate,
          contactId: values.contactId,
          status: eventToEdit?.status || 'todo',
          position: eventToEdit?.position || 0,
          projectId: projectId || eventToEdit?.projectId,
        };
        
        if (eventToEdit && onTaskUpdate) {
            onTaskUpdate({ ...eventToEdit, ...eventData });
        } else if (onTaskCreate) {
            onTaskCreate(eventData);
        }
    }
    
    onOpenChange(false);
  }

  const title = isProjectMode ? (projectToEdit ? 'Edit Project' : 'Create Project') : (eventToEdit ? 'Edit Event' : 'Create Event');
  const description = isProjectMode ? 'Define the details for your new project.' : 'Add a new event to your calendar.';


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>{isProjectMode ? 'Project Name' : 'Title'}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            {isProjectMode ? (
                <>
                    <FormField control={form.control} name="clientId" render={({ field }) => ( <FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="ownerId" render={({ field }) => ( <FormItem><FormLabel>Project Owner</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an owner" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                </>
            ) : (
                <FormField control={form.control} name="contactId" render={({ field }) => ( <FormItem><FormLabel>Contact (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Link a contact..." /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <FormLabel>{isProjectMode ? 'Start Date' : 'Start Date & Time'}</FormLabel>
                    <div className="flex gap-2">
                        <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex-1"><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                        {!isProjectMode && <>
                            <FormField control={form.control} name="startHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                            <FormField control={form.control} name="startMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                        </>}
                    </div>
                </div>
                <div className="space-y-2">
                    <FormLabel>{isProjectMode ? 'Due Date' : 'End Date & Time'}</FormLabel>
                    <div className="flex gap-2">
                        <FormField control={form.control} name="endDate" render={({ field }) => ( <FormItem className="flex-1"><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                         {!isProjectMode && <>
                            <FormField control={form.control} name="endHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                            <FormField control={form.control} name="endMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                        </>}
                    </div>
                </div>
            </div>

            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            {!projectToEdit && (
                 <div className="pt-2">
                    <Button type="button" variant="link" className="p-0 h-auto" onClick={() => setIsProjectMode(prev => !prev)}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        {isProjectMode ? "Switch to simple event" : "Promote to a project"}
                    </Button>
                </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit"><Save className="mr-2 h-4 w-4"/> {eventToEdit || projectToEdit ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
