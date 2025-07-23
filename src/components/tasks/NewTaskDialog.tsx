

"use client";

import { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, set } from 'date-fns';
import { type Event as TaskEvent } from '@/types/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const taskSchema = z.object({
  title: z.string().min(2, { message: "Task title must be at least 2 characters." }),
  description: z.string().optional(),
  startDate: z.date(),
  startHour: z.string(),
  startMinute: z.string(),
  endDate: z.date(),
  endHour: z.string(),
  endMinute: z.string(),
  reminder: z.string().optional(),
}).refine(data => {
    const start = set(data.startDate, { hours: parseInt(data.startHour), minutes: parseInt(data.startMinute) });
    const end = set(data.endDate, { hours: parseInt(data.endHour), minutes: parseInt(data.endMinute) });
    return end > start;
}, {
    message: "End time must be after start time.",
    path: ["endDate"],
});


type TaskFormData = z.infer<typeof taskSchema>;

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreate?: (taskData: Omit<TaskEvent, 'id' | 'userId'>) => void;
  onTaskUpdate?: (taskData: Omit<TaskEvent, 'userId'>) => void;
  projectId: string | null;
  defaultStatus?: 'todo' | 'inProgress' | 'done';
  defaultStartDate?: Date;
  eventToEdit?: TaskEvent | null;
}

export function NewTaskDialog({ isOpen, onOpenChange, onTaskCreate, onTaskUpdate, projectId, defaultStatus = 'todo', defaultStartDate, eventToEdit }: NewTaskDialogProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
        title: "",
        description: "",
        startDate: defaultStartDate || new Date(),
        startHour: String(defaultStartDate?.getHours() ?? new Date().getHours()),
        startMinute: String(defaultStartDate?.getMinutes() ?? 0),
        endDate: defaultStartDate ? new Date(defaultStartDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
        endHour: String(defaultStartDate ? defaultStartDate.getHours() + 1 : new Date().getHours() + 1),
        endMinute: String(defaultStartDate?.getMinutes() ?? 0),
        reminder: "none",
    }
  });
  
  useEffect(() => {
    if (isOpen) {
        if (eventToEdit) {
            form.reset({
                title: eventToEdit.title,
                description: eventToEdit.description,
                startDate: eventToEdit.start,
                startHour: String(eventToEdit.start.getHours()),
                startMinute: String(eventToEdit.start.getMinutes()),
                endDate: eventToEdit.end,
                endHour: String(eventToEdit.end.getHours()),
                endMinute: String(eventToEdit.end.getMinutes()),
                reminder: eventToEdit.reminder || "none",
            });
        } else {
             const start = defaultStartDate || new Date();
             const end = new Date(start.getTime() + 60 * 60 * 1000);
             form.reset({
                title: "",
                description: "",
                startDate: start,
                startHour: String(start.getHours()),
                startMinute: String(start.getMinutes()),
                endDate: end,
                endHour: String(end.getHours()),
                endMinute: String(end.getMinutes()),
                reminder: "none",
            });
        }
    }
  }, [isOpen, eventToEdit, defaultStartDate, form]);

  function onSubmit(values: TaskFormData) {
    const finalStart = set(values.startDate, { hours: parseInt(values.startHour), minutes: parseInt(values.startMinute) });
    const finalEnd = set(values.endDate, { hours: parseInt(values.endHour), minutes: parseInt(values.endMinute) });

    const taskData = {
        title: values.title,
        description: values.description,
        start: finalStart,
        end: finalEnd,
        reminder: values.reminder,
    };

    if (eventToEdit && onTaskUpdate) {
        onTaskUpdate({ ...eventToEdit, ...taskData });
    } else if (onTaskCreate) {
        onTaskCreate({
            ...taskData,
            projectId,
            status: defaultStatus,
            position: 0,
            attendees: [],
        });
    }
    onOpenChange(false);
  }
  
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const date = set(new Date(), { hours: i });
    return { value: String(i), label: format(date, 'h a') };
  });

  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minutes = i * 5;
    return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {eventToEdit ? 'Update the details for this event.' : `Add a new event to your calendar.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="space-y-2">
                <FormLabel>Start Date & Time</FormLabel>
                <div className="flex gap-2">
                    <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-[180px] justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="startHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                    <FormField control={form.control} name="startMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                </div>
            </div>
             <div className="space-y-2">
                <FormLabel>End Date & Time</FormLabel>
                <div className="flex gap-2">
                    <FormField control={form.control} name="endDate" render={({ field }) => ( <FormItem><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-[180px] justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="endHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                    <FormField control={form.control} name="endMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                </div>
                 <FormMessage>{form.formState.errors.endDate?.message}</FormMessage>
            </div>
             <FormField control={form.control} name="reminder" render={({ field }) => ( <FormItem><FormLabel>Reminder</FormLabel><FormControl>
                <Input placeholder="e.g., 15 minutes before" {...field} />
             </FormControl><FormMessage /></FormItem> )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{eventToEdit ? 'Save Changes' : 'Create Event'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
