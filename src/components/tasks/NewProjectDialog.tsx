
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Trash2, Save, Pencil, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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

const projectSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  description: z.string().optional(),
  clientId: z.string().nullable(),
  ownerId: z.string().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  dueDate: z.date().nullable(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Step {
  id: number;
  title: string;
  defaultDurationHours: number;
  startTime: Date;
  checked: boolean;
}

const defaultTemplates: Omit<ProjectTemplate, 'id' | 'userId'>[] = [
    { name: 'Website Design', steps: [ { title: 'Initial Consultation', defaultDurationHours: 2 }, { title: 'Wireframing', defaultDurationHours: 8 }, { title: 'Mockup Design', defaultDurationHours: 16 }, { title: 'Client Review', defaultDurationHours: 4 }, { title: 'Final Delivery', defaultDurationHours: 2 } ] },
    { name: 'Marketing Campaign', steps: [ { title: 'Strategy Session', defaultDurationHours: 4 }, { title: 'Content Creation', defaultDurationHours: 24 }, { title: 'Ad Setup', defaultDurationHours: 8 }, { title: 'Campaign Launch', defaultDurationHours: 2 }, { title: 'Performance Review', defaultDurationHours: 4 } ] }
];

const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const date = set(new Date(), { hours: i });
    return { value: String(i), label: format(date, 'h a') };
});

const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minutes = i * 5;
    return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
});


export function NewProjectDialog({ isOpen, onOpenChange, onProjectCreated, contacts }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onProjectCreated: (project: Project, tasks: TaskEvent[]) => void; contacts: Contact[] }) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [descriptionBeforeSpeech, setDescriptionBeforeSpeech] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", clientId: null, ownerId: null, assigneeIds: [], dueDate: null },
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
        setSteps([]);
    }
  }, [isOpen, form]);
  
  useEffect(() => {
    async function loadTemplates() {
        if (user && isOpen) {
            try {
                const fetchedTemplates = await getProjectTemplates(user.uid);
                setTemplates(fetchedTemplates);
            } catch (error) { console.error("Failed to load templates", error); }
        }
    }
    loadTemplates();
  }, [user, isOpen]);
  
  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    setSteps(prev => [...prev, { id: Date.now(), title: newStepTitle.trim(), defaultDurationHours: 1, startTime: new Date(), checked: true }]);
    setNewStepTitle("");
  };

  const toggleStep = (id: number) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };
  
  const updateStepTitle = (id: number, newTitle: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const updateStepTime = (id: number, type: 'hour' | 'minute', value: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id === id) {
        const newTime = new Date(s.startTime);
        if (type === 'hour') newTime.setHours(parseInt(value));
        if (type === 'minute') newTime.setMinutes(parseInt(value));
        return { ...s, startTime: newTime };
      }
      return s;
    }));
  };

  const handleApplyTemplate = (templateName: string) => {
      const template = [...defaultTemplates, ...templates].find(t => t.name === templateName);
      if (template) {
          const newSteps = template.steps.map(step => ({ ...step, id: Date.now() + Math.random(), startTime: new Date(), checked: true }));
          setSteps(prev => [...prev, ...newSteps]);
          toast({ title: 'Template Applied', description: `Added ${newSteps.length} steps from "${templateName}".`});
      }
  };

  async function onSubmit(values: ProjectFormData) {
    if (!user) { toast({ variant: "destructive", title: "Not logged in" }); return; }
    
    const projectData = { ...values, userId: user.uid, reminder: null };
    const tasksData = steps
      .filter(s => s.checked)
      .map(s => ({
        title: s.title,
        status: 'todo' as 'todo',
        start: s.startTime,
        end: new Date(s.startTime.getTime() + s.defaultDurationHours * 60 * 60 * 1000),
      }));

    try {
        const newProject = await addProjectWithTasks(projectData, tasksData as any);
        const createdTasks = tasksData.map((t, i) => ({ ...t, id: `temp-${i}`, projectId: newProject.id, userId: user.uid, position: i }));
        onProjectCreated(newProject, createdTasks);
        toast({ title: "Project Created", description: `"${newProject.name}" has been successfully created.` });
        onOpenChange(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to create project", description: error.message });
    }
  }

  async function handleSaveTemplate() {
    if (!user) return;
    if (!newTemplateName.trim()) { toast({ variant: 'destructive', title: 'Template name is required.' }); return; }
    const stepsToSave = steps.filter(s => s.checked).map(({ id, checked, startTime, ...rest }) => rest);
    if (stepsToSave.length === 0) { toast({ variant: 'destructive', title: 'No steps selected.', description: 'Please select at least one step to save in the template.' }); return; }

    const templateData = { name: newTemplateName.trim(), steps: stepsToSave, userId: user.uid };
    try {
        const newTemplate = await addProjectTemplate(templateData);
        setTemplates(prev => [...prev, newTemplate]);
        toast({ title: 'Template Saved!', description: `Template "${newTemplate.name}" has been saved.` });
        setIsTemplateDialogOpen(false);
        setNewTemplateName('');
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to save template", description: error.message });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b text-center">
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Fill in the details below to create a new project and its initial tasks.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1">
                <div className="space-y-6 px-6 py-4">
                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><div className="relative"><FormControl><Textarea {...field} className="pr-10" /></FormControl><Button type="button" variant={isListening ? 'destructive' : 'ghost'} size="icon" className="absolute bottom-2 right-2 h-7 w-7" onClick={handleDictateDescription} disabled={isSupported === false}><span className="sr-only">Dictate description</span>{isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</Button></div><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={form.control} name="clientId" render={({ field }) => ( <FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="ownerId" render={({ field }) => ( <FormItem><FormLabel>Project Owner</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select an owner" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="assigneeIds" render={({ field }) => ( <FormItem><FormLabel>Assignee</FormLabel><Select onValueChange={(value) => field.onChange([value])} defaultValue={field.value?.[0] || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select an assignee" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="dueDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || null} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                    </div>
                    
                    <Separator />

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Project Steps (Tasks)</h3>
                        <div className="space-y-2">
                             <div className="grid grid-cols-2 gap-4">
                                <Select onValueChange={handleApplyTemplate}>
                                    <SelectTrigger><SelectValue placeholder="Apply a template..." /></SelectTrigger>
                                    <SelectContent>
                                        {[...defaultTemplates, ...templates].map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                 <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                                     <DialogTrigger asChild><Button type="button" variant="outline"><Save className="mr-2 h-4 w-4" /> Save as Template</Button></DialogTrigger>
                                     <DialogContent><DialogHeader><DialogTitle>Save as Template</DialogTitle><DialogDescription>Save the currently selected steps as a new reusable template.</DialogDescription></DialogHeader><div className="py-4"><Input placeholder="Template Name" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} /></div><DialogFooter><Button variant="ghost" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveTemplate}>Save Template</Button></DialogFooter></DialogContent>
                                 </Dialog>
                            </div>
                            <div className="flex gap-2">
                                <Input placeholder="Add a new custom step..." value={newStepTitle} onChange={e => setNewStepTitle(e.target.value)} onKeyDown={e => {if (e.key === 'Enter') { e.preventDefault(); handleAddStep();}}} />
                                <Button type="button" onClick={handleAddStep}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2 rounded-md border p-2">
                            {steps.length > 0 ? steps.map((step, index) => (
                                <div key={step.id} className="flex items-center gap-2 p-1 rounded hover:bg-muted/50">
                                    <Checkbox checked={step.checked} onCheckedChange={() => toggleStep(step.id)} id={`step-${step.id}`} />
                                    <Label htmlFor={`step-${step.id}`} className="font-mono text-xs w-6">{index + 1}.</Label>
                                    <Label className="flex-1 cursor-text" onClick={() => setEditingStepId(step.id)}>{step.title}</Label>
                                     <div className="flex items-center gap-1">
                                        <Select value={String(step.startTime.getHours())} onValueChange={(value) => updateStepTime(step.id, 'hour', value)}>
                                            <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select value={String(Math.floor(step.startTime.getMinutes() / 5) * 5)} onValueChange={(value) => updateStepTime(step.id, 'minute', value)}>
                                            <SelectTrigger className="w-[60px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingStepId(step.id)}><Pencil className="h-3 w-3" /></Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSteps(prev => prev.filter(s => s.id !== step.id))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                </div>
                            )) : <p className="text-sm text-muted-foreground text-center p-4">No steps added yet.</p>}
                        </div>
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
