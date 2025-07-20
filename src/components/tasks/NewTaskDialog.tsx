
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
import { format } from 'date-fns';
import { type Event as TaskEvent } from '@/types/calendar';

const taskSchema = z.object({
  title: z.string().min(2, { message: "Task title must be at least 2 characters." }),
  description: z.string().optional(),
  start: z.date(),
  end: z.date(),
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
        start: defaultStartDate || new Date(),
        end: defaultStartDate ? new Date(defaultStartDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
    }
  });
  
  useEffect(() => {
    if (isOpen) {
        if (eventToEdit) {
            form.reset({
                title: eventToEdit.title,
                description: eventToEdit.description,
                start: eventToEdit.start,
                end: eventToEdit.end,
            });
        } else {
             form.reset({
                title: "",
                description: "",
                start: defaultStartDate || new Date(),
                end: defaultStartDate ? new Date(defaultStartDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
            });
        }
    }
  }, [isOpen, eventToEdit, defaultStartDate, form]);

  function onSubmit(values: TaskFormData) {
    if (eventToEdit && onTaskUpdate) {
        onTaskUpdate({ ...eventToEdit, ...values });
    } else if (onTaskCreate && projectId) {
        onTaskCreate({
            ...values,
            projectId,
            status: defaultStatus,
            position: 0, // Will be recalculated in the parent
        });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {eventToEdit ? 'Update the details for this task.' : `Add a new task to this project.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="start" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="end" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{eventToEdit ? 'Save Changes' : 'Create Task'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
