
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { type Contact } from '@/services/contact-service';
import { updateProject, type Project } from '@/services/project-service';

const projectSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  description: z.string().optional(),
  ownerId: z.string().nullable(),
  dueDate: z.date().nullable(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export function ProjectDetailsDialog({ isOpen, onOpenChange, project, onProjectUpdated, contacts }: { isOpen: boolean; onOpenChange: (open: boolean) => void; project: Project; onProjectUpdated: (project: Project) => void; contacts: Contact[] }) {
  const { toast } = useToast();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        dueDate: project.dueDate,
    }
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            name: project.name,
            description: project.description,
            ownerId: project.ownerId,
            dueDate: project.dueDate,
        });
    }
  }, [isOpen, project, form]);

  async function onSubmit(values: ProjectFormData) {
    try {
        await updateProject(project.id, values);
        onProjectUpdated({ ...project, ...values });
        toast({ title: "Project Updated", description: `"${values.name}" has been updated.` });
        onOpenChange(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to update project", description: error.message });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
          <DialogDescription>Make changes to your project here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="ownerId" render={({ field }) => ( <FormItem><FormLabel>Project Owner</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select an owner" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="dueDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
