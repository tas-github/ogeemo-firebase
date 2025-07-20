
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { Label } from '../ui/label';

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
  const [isTemplateSaveDialogOpen, setIsTemplateSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const router = useRouter();

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
  
  const saveProject = async (values: ProjectFormData): Promise<Project | null> => {
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in" });
      return null;
    }

    let finalStartDate: Date | null = null;
    if (values.startDate && values.startHour && values.startMinute) {
      finalStartDate = set(values.startDate, {
        hours: parseInt(values.startHour),
        minutes: parseInt(values.startMinute)
      });
    }

    const projectData = { ...values, startDate: finalStartDate, userId: user.uid, reminder: null };
    const tasksData: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[] = [];

    try {
      const newProject = await addProjectWithTasks(projectData, tasksData);
      onProjectCreated(newProject, []);
      toast({ title: "Project Created", description: `"${newProject.name}" has been successfully created.` });
      return newProject;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to create project", description: error.message });
      return null;
    }
  };
  
  const onSubmit = async (values: ProjectFormData) => {
    const newProject = await saveProject(values);
    if (newProject) {
        onOpenChange(false);
    }
  };

  const handleSaveAndDefineSteps = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const values = form.getValues();
      const newProject = await saveProject(values);
      if (newProject) {
          sessionStorage.setItem('selectedProjectId', newProject.id);
          router.push('/projects/steps');
          onOpenChange(false);
      }
    } else {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill in all required fields before proceeding.",
        })
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!user) return;
    const { name, description } = form.getValues();
    if (!newTemplateName.trim()) {
      toast({ variant: 'destructive', title: 'Template name is required.' });
      return;
    }
    
    // Note: Project templates have 'steps', but this dialog doesn't manage them.
    // We'll save with an empty steps array for now.
    const templateData: Omit<ProjectTemplate, 'id'> = {
        name: newTemplateName.trim(),
        userId: user.uid,
        steps: [], // No steps defined in this dialog
    };

    try {
        const newTemplate = await addProjectTemplate(templateData);
        setTemplates(prev => [...prev, newTemplate]);
        toast({ title: "Template Saved", description: `"${newTemplate.name}" has been created.` });
        setIsTemplateSaveDialogOpen(false);
        setNewTemplateName("");
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to save template", description: error.message });
    }
  };

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
        const description = template.steps.map(step => `- ${step.title}`).join('\n');
        form.setValue('description', description);
    }
  };

  return (
    <>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <FormLabel>Start Date & Time</FormLabel>
                               <div className="flex gap-2">
                                   <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex-1"><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                                   <FormField control={form.control} name="startHour" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                                   <FormField control={form.control} name="startMinute" render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></FormItem> )} />
                               </div>
                            </div>
                            <FormField control={form.control} name="dueDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                        </div>
                    </div>
                </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t flex-col-reverse sm:flex-row sm:justify-between sm:items-center">
              <div className="flex justify-start gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={() => setIsTemplateSaveDialogOpen(true)}>
                  <Save className="mr-2 h-4 w-4" /> Save as Template
                </Button>
              </div>
              <div className="flex justify-end gap-2 w-full sm:w-auto">
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="button" onClick={handleSaveAndDefineSteps} className="bg-orange-500 hover:bg-orange-600 text-white">
                      <HardHat className="mr-2 h-4 w-4" />
                      Save & Define Steps
                  </Button>
                  <Button type="submit">Create Project</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <Dialog open={isTemplateSaveDialogOpen} onOpenChange={setIsTemplateSaveDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Save Project as Template</DialogTitle>
                <DialogDescription>
                    This will save the project's name and description as a reusable template.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                    id="template-name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., Standard Website Build"
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsTemplateSaveDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveAsTemplate}>Save Template</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
