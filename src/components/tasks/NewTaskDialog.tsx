
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type Project, type Event as TaskEvent, type ProjectUrgency, type ProjectImportance, type ProjectStatus, type ProjectTemplate, type ProjectStep } from '@/types/calendar-types';
import { type Contact, type FolderData } from '@/data/contacts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Plus, Calendar as CalendarIcon, Save, Trash2 } from 'lucide-react';
import ContactFormDialog from '../contacts/contact-form-dialog';
import { getFolders } from '@/services/contact-service';
import { useAuth } from '@/context/auth-context';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format, set, addMinutes } from 'date-fns';
import { addProjectTemplate, getProjectTemplates, updateProjectWithTasks } from '@/services/project-service';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const projectSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  description: z.string().optional(),
  contactId: z.string().optional(),
  urgency: z.enum(['urgent', 'important', 'optional']).default('important'),
  importance: z.enum(['A', 'B', 'C']).default('B'),
  projectManagerId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  projectValue: z.coerce.number().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed']).default('planning'),
});


type ProjectFormData = z.infer<typeof projectSchema>;

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectCreate: (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[]) => void;
  onProjectUpdate?: (project: Project, tasks: Partial<ProjectStep>[]) => void;
  contacts?: Contact[];
  onContactsChange?: (contacts: Contact[]) => void;
  projectToEdit?: Project | null;
  initialMode?: 'project' | 'task' | 'event';
  initialData?: Partial<any>;
}

export function NewTaskDialog({
  isOpen,
  onOpenChange,
  onProjectCreate,
  onProjectUpdate,
  contacts = [],
  onContactsChange,
  projectToEdit,
  initialData,
}: NewTaskDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clientAction, setClientAction] = useState<'select' | 'add'>('select');
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactFolders, setContactFolders] = useState<FolderData[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  
  // State for integrated step planning
  const [steps, setSteps] = useState<Partial<ProjectStep>[]>([]);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");
  const [newStepDate, setNewStepDate] = useState<Date | undefined>(new Date());
  const [newStepHour, setNewStepHour] = useState<string>(String(new Date().getHours()));
  const [newStepMinute, setNewStepMinute] = useState<string>("0");
  const [newStepConnectToCalendar, setNewStepConnectToCalendar] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", contactId: "", urgency: 'important', importance: 'B', projectManagerId: "", startDate: undefined, endDate: undefined, projectValue: 0, status: 'planning' },
  });
  
  const importanceValue = form.watch('importance');

  useEffect(() => {
    if (isOpen) {
        if (projectToEdit) {
            form.reset({
                name: projectToEdit.name,
                description: projectToEdit.description || "",
                contactId: projectToEdit.contactId || "",
                urgency: projectToEdit.urgency || 'important',
                importance: projectToEdit.importance || 'B',
                projectManagerId: projectToEdit.projectManagerId || "",
                startDate: projectToEdit.startDate ? new Date(projectToEdit.startDate) : undefined,
                endDate: projectToEdit.endDate ? new Date(projectToEdit.endDate) : undefined,
                projectValue: projectToEdit.projectValue || 0,
                status: projectToEdit.status || 'planning',
            });
            setSteps(projectToEdit.steps || []);
        } else if (initialData) {
            form.reset({
                name: initialData.name || "",
                description: initialData.description || "",
                contactId: initialData.contactId || "",
                urgency: 'important',
                importance: 'B',
                projectManagerId: "",
                startDate: undefined,
                endDate: undefined,
                projectValue: 0,
                status: 'planning',
            });
            setSteps([]);
        } else {
            form.reset({ name: "", description: "", contactId: "", urgency: 'important', importance: 'B', projectManagerId: "", startDate: undefined, endDate: undefined, projectValue: 0, status: 'planning' });
            setSteps([]);
        }
        
        setClientAction('select'); // Always default to select
    }
  }, [isOpen, projectToEdit, initialData, form]);

  useEffect(() => {
      async function loadFolders() {
          if (user && isContactFormOpen) {
              const folders = await getFolders(user.uid);
              setContactFolders(folders);
          }
      }
      async function loadTemplates() {
          if (user && isOpen) {
              const fetchedTemplates = await getProjectTemplates(user.uid);
              setTemplates(fetchedTemplates);
          }
      }
      loadFolders();
      loadTemplates();
  }, [user, isContactFormOpen, isOpen]);

  async function onSubmit(values: ProjectFormData) {
    if (projectToEdit && onProjectUpdate && user) {
        const updatedProjectData = {
            ...projectToEdit,
            ...values,
            contactId: values.contactId || null,
            projectManagerId: values.projectManagerId || null,
            projectValue: values.projectValue || null,
        };
        onProjectUpdate(updatedProjectData, steps);
    } else {
        const tasksFromSteps = steps
            .filter(step => step.connectToCalendar && step.startTime)
            .map((step, index) => ({
                title: step.title!,
                description: step.description,
                start: step.startTime!,
                end: addMinutes(step.startTime!, step.durationMinutes || 30),
                status: 'todo' as TaskStatus,
                position: index,
            }));
        onProjectCreate({
            name: values.name,
            description: values.description,
            contactId: values.contactId || null,
            status: values.status as ProjectStatus,
            urgency: values.urgency as ProjectUrgency,
            importance: values.importance as ProjectImportance,
            projectManagerId: values.projectManagerId || null,
            startDate: values.startDate || null,
            endDate: values.endDate || null,
            projectValue: values.projectValue || null,
            steps: steps as ProjectStep[],
        }, tasksFromSteps);
    }
    onOpenChange(false);
  }
  
  const handleContactSave = (savedContact: Contact, isEditing: boolean) => {
    if (onContactsChange) {
        let updatedContacts;
        if (isEditing) {
          updatedContacts = contacts.map(c => c.id === savedContact.id ? savedContact : c);
        } else {
          updatedContacts = [...contacts, savedContact];
        }
        onContactsChange(updatedContacts); // Update parent component's state
    }
    form.setValue('contactId', savedContact.id);
    setClientAction('select');
    setIsContactFormOpen(false);
  };
  
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
        form.setValue('name', template.name);
        form.setValue('description', template.description);
        const templateTasks = template.tasks || [];
        setSteps(templateTasks.map(t => ({...t, id: `temp_${Date.now()}`})));
        toast({ title: "Template Applied", description: `Project details and ${templateTasks.length} steps have been loaded.`});
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!user || !newTemplateName.trim()) {
        toast({ variant: 'destructive', title: 'Template name is required.' });
        return;
    }
    
    const templateData: Omit<ProjectTemplate, 'id'> = {
        name: newTemplateName,
        description: form.getValues('description') || '',
        tasks: steps.map(({ id, ...rest }) => rest) as any,
        userId: user.uid,
    };
    
    try {
        const newTemplate = await addProjectTemplate(templateData);
        setTemplates(prev => [...prev, newTemplate]);
        toast({ title: 'Template Saved', description: `"${newTemplateName}" has been saved.` });
        setIsTemplateDialogOpen(false);
        setNewTemplateName('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to save template', description: error.message });
    }
  };
  
  const handleAddStep = () => {
        if (!newStepTitle.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title for the step.' });
            return;
        }

        let stepStartTime: Date | null = null;
        if (newStepConnectToCalendar && newStepDate) {
            stepStartTime = set(newStepDate, {
                hours: parseInt(newStepHour),
                minutes: parseInt(newStepMinute)
            });
        }
        
        const newStep: Partial<ProjectStep> = {
            id: `temp_${Date.now()}`,
            title: newStepTitle,
            description: newStepDescription,
            isBillable: true,
            connectToCalendar: newStepConnectToCalendar,
            startTime: stepStartTime,
            isCompleted: false,
        };
        
        setSteps(prev => [...prev, newStep]);
        setNewStepTitle("");
        setNewStepDescription("");
    };

    const handleDeleteStep = (stepId: string) => {
        setSteps(prev => prev.filter(step => step.id !== stepId));
    };
    
    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const date = set(new Date(), { hours: i });
        return { value: String(i), label: format(date, 'h a') };
    });

    const minuteOptions = Array.from({ length: 12 }, (_, i) => {
        const minutes = i * 5;
        return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
    });


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold font-headline text-primary">
                {projectToEdit ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogDescription>
              {projectToEdit ? 'Update the details for your project.' : 'Fill in the details to create a new project.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                      {/* Left Column: Project Details */}
                      <div className="space-y-4">
                        {!projectToEdit && (
                          <FormItem>
                              <FormLabel>Start from a Template</FormLabel>
                              <Select onValueChange={handleTemplateSelect}>
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Select a template (optional)..." />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {templates.map(template => (
                                          <SelectItem key={template.id} value={template.id}>
                                              {template.name}
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </FormItem>
                        )}
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Project Name</FormLabel> <FormControl><Input placeholder="e.g., Website Redesign" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        
                        <div className="space-y-2">
                          <FormLabel>Client</FormLabel>
                          <RadioGroup onValueChange={(value: 'select' | 'add') => setClientAction(value)} value={clientAction} className="flex space-x-4">
                              <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="select" /></FormControl><FormLabel className="font-normal">Select Existing Client</FormLabel></FormItem>
                              <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="add" /></FormControl><FormLabel className="font-normal">Create New Client</FormLabel></FormItem>
                          </RadioGroup>
                        </div>

                        {clientAction === 'select' ? (
                          <FormField control={form.control} name="contactId" render={({ field }) => ( <FormItem> <Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Assign a client (optional)" /></SelectTrigger></FormControl><SelectContent>{contacts.map(contact => (<SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>))}</SelectContent></Select><FormMessage /> </FormItem> )} />
                        ) : (
                          <Button variant="outline" className="w-full" onClick={() => setIsContactFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add New Contact</Button>
                        )}
                        
                        <FormField control={form.control} name="projectManagerId" render={({ field }) => ( <FormItem><FormLabel>Project Manager</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Assign a project manager" /></SelectTrigger></FormControl><SelectContent>{contacts.map(contact => (<SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>))}</SelectContent></Select><FormMessage /> </FormItem> )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                          <FormField control={form.control} name="endDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="projectValue" render={({ field }) => ( <FormItem><FormLabel>Project Value</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /> </FormItem> )} />
                          <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Initial Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="planning">Planning</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="on-hold">On-Hold</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        </div>
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl><Textarea placeholder="Describe the project goals and objectives..." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="urgency" render={({ field }) => ( <FormItem><FormLabel>Set Urgency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue>{`${importanceValue} - ${field.value.charAt(0).toUpperCase() + field.value.slice(1)}`}</SelectValue></SelectTrigger></FormControl><SelectContent><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="important">Important</SelectItem><SelectItem value="optional">Optional</SelectItem></SelectContent></Select></FormItem> )} />
                          <FormField control={form.control} name="importance" render={({ field }) => ( <FormItem><FormLabel>Set Importance</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="A">A - Critical</SelectItem><SelectItem value="B">B - Important</SelectItem><SelectItem value="C">C - Optional</SelectItem></SelectContent></Select></FormItem> )} />
                        </div>
                      </div>

                      {/* Right Column: Step Planning */}
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="p-4"><CardTitle className="text-base">Add a New Step</CardTitle></CardHeader>
                          <CardContent className="p-4 pt-0 space-y-4">
                            <div className="space-y-2"><Label htmlFor="step-title">Step Title</Label><Input id="step-title" value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="step-desc">Description</Label><Textarea id="step-desc" value={newStepDescription} onChange={(e) => setNewStepDescription(e.target.value)} /></div>
                            <div className="flex items-center space-x-2 pt-2"><Checkbox id="connect-to-calendar" checked={newStepConnectToCalendar} onCheckedChange={(checked) => setNewStepConnectToCalendar(!!checked)} /><div className="grid gap-1.5 leading-none"><label htmlFor="connect-to-calendar" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Add to Calendar</label><p className="text-xs text-muted-foreground">Schedules this step as a task in the calendar.</p></div></div>
                            {newStepConnectToCalendar && (
                                <div className="space-y-2 animate-in fade-in-50 duration-300">
                                    <Label>Start Date & Time</Label>
                                    <div className="flex gap-2">
                                        <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newStepDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{newStepDate ? format(newStepDate, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={newStepDate} onSelect={setNewStepDate} initialFocus /></PopoverContent></Popover>
                                    </div>
                                    <div className="flex gap-2">
                                        <Select value={newStepHour} onValueChange={setNewStepHour}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                        <Select value={newStepMinute} onValueChange={setNewStepMinute}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                </div>
                            )}
                            <Button onClick={handleAddStep} className="w-full" type="button"><Plus className="mr-2 h-4 w-4" /> Add Step to Plan</Button>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="p-4"><CardTitle className="text-base">Project Plan</CardTitle></CardHeader>
                          <CardContent className="p-4 pt-0">
                            {steps.length > 0 ? (
                                <div className="space-y-2">{steps.map((step, index) => (<div key={step.id} className="p-2 border rounded-md flex items-start justify-between"><div className="flex-1"><p className="font-semibold text-sm">{index + 1}. {step.title}</p>{step.connectToCalendar && step.startTime && (<p className="text-xs text-primary mt-1 flex items-center gap-1"><CalendarIcon className="h-3 w-3" />Scheduled for {format(step.startTime as Date, 'PPp')}</p>)}</div><Button variant="ghost" size="icon" className="h-7 w-7" type="button" onClick={() => handleDeleteStep(step.id!)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>))}</div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg"><p className="text-sm">No steps defined yet.</p></div>
                            )}
                          </CardContent>
                        </Card>

                      </div>

                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 border-t mt-auto">
                    <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
                        <Save className="mr-2 h-4 w-4" /> Save as Template
                    </Button>
                    <div className="flex-1" />
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit">{projectToEdit ? 'Save Changes' : 'Create Project'}</Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {isContactFormOpen && (
        <ContactFormDialog
            isOpen={isContactFormOpen}
            onOpenChange={setIsContactFormOpen}
            contactToEdit={null}
            folders={contactFolders}
            onSave={handleContactSave}
        />
      )}
      
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              This will save the project's details and steps as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name">Template Name</Label>
            <Input 
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., 'Standard Website Build'"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAsTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
