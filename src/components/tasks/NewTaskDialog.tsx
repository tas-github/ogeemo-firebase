

"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { format, set } from 'date-fns';

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
import { Calendar as CalendarIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { type Event } from '@/types/calendar';
import { type Contact } from '@/services/contact-service';

const taskSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  contactId: z.string().optional(),
  startDate: z.date({ required_error: "A start date is required." }),
  startHour: z.string().optional(),
  startMinute: z.string().optional(),
  endDate: z.date({ required_error: "An end date is required." }),
  endHour: z.string().optional(),
  endMinute: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreate?: (taskData: Omit<Event, 'id' | 'userId'>) => void;
  onTaskUpdate?: (taskData: Event) => void;
  eventToEdit?: Event | null;
  projectId?: string | null;
  contacts?: Contact[];
}

export function NewTaskDialog({ isOpen, onOpenChange, onTaskCreate, onTaskUpdate, eventToEdit, projectId, contacts = [] }: NewTaskDialogProps) {
  const { toast } = useToast();
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        form.reset({
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
        form.reset({
          title: "",
          description: "",
          contactId: "",
          startDate: now,
          startHour: String(now.getHours()),
          startMinute: String(now.getMinutes()),
          endDate: startOfNextHour,
          endHour: String(startOfNextHour.getHours()),
          endMinute: String(startOfNextHour.getMinutes()),
        });
      }
    }
  }, [isOpen, eventToEdit, form]);

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const date = set(new Date(), { hours: i });
    return { value: String(i), label: format(date, 'h a') };
  });

  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minutes = i * 5;
    return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
  });

  async function onSubmit(values: TaskFormData) {
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
    
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{eventToEdit ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {eventToEdit ? 'Update the details for this event.' : 'Add a new event to your calendar.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="contactId" render={({ field }) => ( <FormItem><FormLabel>Contact (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Link a contact..." /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
            <div className="space-y-2">
                <FormLabel>Start Date & Time</FormLabel>
                <div className="flex gap-2">
                    <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="startHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                    <FormField control={form.control} name="startMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                </div>
            </div>
            <div className="space-y-2">
                <FormLabel>End Date & Time</FormLabel>
                <div className="flex gap-2">
                    <FormField control={form.control} name="endDate" render={({ field }) => ( <FormItem><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="endHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                    <FormField control={form.control} name="endMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                </div>
            </div>
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit"><Save className="mr-2 h-4 w-4"/> {eventToEdit ? 'Save Changes' : 'Create Event'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
