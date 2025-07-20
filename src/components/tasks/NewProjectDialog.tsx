
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Trash2, Save, Pencil, Mic, Square, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, set } from 'date-fns';
import { type Contact } from '@/services/contact-service';
import { addProjectWithTasks, getProjectTemplates, addProjectTemplate, type Project, type ProjectTemplate, type Event as TaskEvent } from '@/services/project-service';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import Link from 'next/link';

const projectSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  description: z.string().optional(),
  clientId: z.string().nullable(),
  ownerId: z.string().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  startDate: z.date().nullable(),
  startHour: z.string().optional(),
  startMinute: z.string().optional(),
  dueDate: z.date().nullable(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export function NewProjectDialog({ isOpen, onOpenChange, onProjectCreated, contacts }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onProjectCreated: (project: Project, tasks: TaskEvent[]) => void; contacts: Contact[] }) {
  const [descriptionBeforeSpeech, setDescriptionBeforeSpeech] = useState("");
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", clientId: null, ownerId: null, assigneeIds: [], startDate: new Date(), startHour: String(new Date().getHours()), startMinute: '0', dueDate: null },
  });
  
  const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
    onTranscript: (transcript) => {
      const newText = descriptionBeforeSpeech ? `${descriptionBeforeSpeech} ${transcript}`.trim() : transcript;
      form.setValue('description', newText, { shouldValidate: true });
    },
  });

  const handleDictateDescription = () => {
      if (isListening) {
          stopListening();
      } else {
          setDescriptionBeforeSpeech(form.getValues('description') || '');
          form.setFocus('description');
          startListening();
      }
  };

  useEffect(() => {
    async function loadTemplates() {
        if (user && isOpen) {
            try {
                const fetchedTemplates = await getProjectTemplates(user.uid);
                setTemplates(fetchedTemplates);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Could not load templates' });
            }
        }
    }
    loadTemplates();
  }, [user, isOpen, toast]);


  useEffect(() => {
    if (isOpen) {
        const ideaToProjectRaw = sessionStorage.getItem('ogeemo-idea-to-project');
        if (ideaToProjectRaw) {
            try {
                const idea = JSON.parse(ideaToProjectRaw);
                form.setValue('name', idea.title || "");
                form.setValue('description', idea.description?.replace(/<[^>]+>/g, '') || ""); // Strip HTML
            } catch { /* ignore parse error */ }
            sessionStorage.removeItem('ogeemo-idea-to-project');
        }
    } else {
        form.reset();
    }
  }, [isOpen, form]);
  
  async function onSubmit(values: ProjectFormData) {
    if (!user) { toast({ variant: "destructive", title: "Not logged in" }); return; }
    
    let finalStartDate: Date | null = null;
    if (values.startDate && values.startHour && values.startMinute) {
        finalStartDate = set(values.startDate, {
            hours: parseInt(values.startHour),
            minutes: parseInt(values.startMinute)
        });
    }

    const projectData = { ...values, startDate: finalStartDate, userId: user.uid, reminder: null };
    
    // Tasks are now handled on a separate page, so we pass an empty array.
    const tasksData: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[] = [];

    try {
        const newProject = await addProjectWithTasks(projectData, tasksData);
        onProjectCreated(newProject, []);
        toast({ title: "Project Created", description: `"${newProject.name}" has been successfully created.` });
        onOpenChange(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to create project", description: error.message });
    }
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const date = set(new Date(), { hours: i });
    return { value: String(i), label: format(date, 'h a') };
  });

  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minutes = i * 5;
    return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
  });
  
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
        form.setValue('name', template.name);
        // Assuming template.steps is an array of objects with a `title` property.
        const description = template.steps.map(step => `- ${step.title}`).join('\n');
        form.setValue('description', description);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b text-center">
          <DialogTitle className="text-3xl font-bold font-headline text-primary">Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project. You can define specific steps and tasks after creation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1">
                <div className="space-y-6 px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormItem>
                            <FormLabel>Select a Template</FormLabel>
                            <Select onValueChange={handleTemplateSelect}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Or choose a template..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    </div>

                    <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><div className="relative"><FormControl><Textarea {...field} className="pr-10" rows={4} /></FormControl><Button type="button" variant={isListening ? 'destructive' : 'ghost'} size="icon" className="absolute bottom-2 right-2 h-7 w-7" onClick={handleDictateDescription} disabled={isSupported === false}><span className="sr-only">Dictate description</span>{isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</Button></div><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="clientId" render={({ field }) => ( <FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="ownerId" render={({ field }) => ( <FormItem><FormLabel>Project Owner</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select an owner" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="assigneeIds" render={({ field }) => ( <FormItem><FormLabel>Assignee</FormLabel><Select onValueChange={(value) => field.onChange([value])} defaultValue={field.value?.[0] || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select an assignee" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <FormLabel>Start Date &amp; Time</FormLabel>
                           <div className="flex gap-2">
                               <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex-1"><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                               <FormField control={form.control} name="startHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                               <FormField control={form.control} name="startMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                           </div>
                        </div>
                         <FormField control={form.control} name="dueDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                    </div>
                    
                    <Separator />

                    <div>
                        <Button asChild type="button" variant="outline" className="w-full">
                            <Link href="/projects/steps">
                                <HardHat className="mr-2 h-4 w-4" />
                                Define Project Steps
                            </Link>
                        </Button>
                    </div>

                </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
