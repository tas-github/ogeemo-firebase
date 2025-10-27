
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Save, Trash2, Plus, Calendar, GripVertical, X, Route } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Project, type ProjectStep } from '@/types/calendar-types';
import { PROJECT_PLAN_SESSION_KEY } from './NewTaskDialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarPicker } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { format, set, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '@/context/auth-context';
import { DraggableStep } from './DraggableStep';
import Link from 'next/link';
import { ProjectManagementHeader } from './ProjectManagementHeader';


const StepItem = ({ step, onDelete }: { step: Partial<ProjectStep>, onDelete: (id: string) => void }) => {
    if (!step.id) return null;
    return (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted border">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
                <p className="font-semibold text-sm">{step.title}</p>
                {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(step.id!)}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
};


export default function ProjectStepsView() {
  const [projectData, setProjectData] = useState<Partial<Project> | null>(null);
  const [steps, setSteps] = useState<Partial<ProjectStep>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");
  const [newStepDate, setNewStepDate] = useState<Date | undefined>(new Date());
  const [newStepHour, setNewStepHour] = useState<string>(String(new Date().getHours()));
  const [newStepMinute, setNewStepMinute] = useState<string>("0");
  const [newStepConnectToCalendar, setNewStepConnectToCalendar] = useState(false);

  useEffect(() => {
    async function loadData() {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const sessionDataRaw = sessionStorage.getItem(PROJECT_PLAN_SESSION_KEY);
            if (sessionDataRaw) {
                const sessionData = JSON.parse(sessionDataRaw);
                // Ensure dates are parsed correctly
                const parsedProjectData = {
                    ...sessionData.projectData,
                    startDate: sessionData.projectData.startDate ? parseISO(sessionData.projectData.startDate) : undefined,
                    endDate: sessionData.projectData.endDate ? parseISO(sessionData.projectData.endDate) : undefined,
                };
                setProjectData(parsedProjectData);
                setSteps(sessionData.steps || []);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'No project data found. Please return to the project dialog.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load project plan.' });
        } finally {
            setIsLoading(false);
        }
    }
    loadData();
  }, [toast, user]);

  const handleProjectDataChange = (field: keyof Project, value: any) => {
    setProjectData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveAndReturn = () => {
    const sessionData = {
        projectData: projectData,
        steps: steps,
    };
    sessionStorage.setItem(PROJECT_PLAN_SESSION_KEY, JSON.stringify(sessionData));
    router.back();
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
            id: `temp_${Date.now()}_${Math.random()}`,
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

    const moveStep = useCallback((dragIndex: number, hoverIndex: number) => {
        const newSteps = [...steps];
        const [draggedItem] = newSteps.splice(dragIndex, 1);
        newSteps.splice(hoverIndex, 0, draggedItem);
        setSteps(newSteps);
        
        const sessionData = {
            projectData: projectData,
            steps: newSteps,
        };
        sessionStorage.setItem(PROJECT_PLAN_SESSION_KEY, JSON.stringify(sessionData));

    }, [steps, projectData]);
    
    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const date = set(new Date(), { hours: i });
        return { value: String(i), label: format(date, 'h a') };
    });

    const minuteOptions = Array.from({ length: 12 }, (_, i) => {
        const minutes = i * 5;
        return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
    });

  if (isLoading || !projectData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <header className="relative text-center">
            <h1 className="text-2xl font-bold font-headline text-primary">Project Organizer</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
                Break down your project into manageable steps and schedule them on your calendar.
            </p>
             <div className="absolute top-0 right-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </Button>
            </div>
        </header>
        
        <ProjectManagementHeader />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left Column for Details and Plan */}
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                        <CardDescription>Edit the core details of your project.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">Project Name</Label>
                            <Input id="project-name" value={projectData.name || ''} onChange={(e) => handleProjectDataChange('name', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="project-desc">Description</Label>
                            <Textarea id="project-desc" value={projectData.description || ''} onChange={(e) => handleProjectDataChange('description', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Project Plan</CardTitle>
                        <CardDescription>Drag and drop the steps to reorder them.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[200px] p-4 border rounded-lg space-y-2">
                        {steps.map((step, index) => (
                            <DraggableStep key={step.id} step={step} index={index} moveStep={moveStep}>
                                <StepItem
                                    step={step}
                                    onDelete={handleDeleteStep}
                                />
                            </DraggableStep>
                        ))}
                    </CardContent>
                </Card>
            </div>
            
            {/* Right Column for Adding Steps */}
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Step</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="step-title">Step Title</Label><Input id="step-title" value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="step-desc">Description</Label><Textarea id="step-desc" value={newStepDescription} onChange={(e) => setNewStepDescription(e.target.value)} /></div>
                        <div className="flex items-center space-x-2 pt-2"><Checkbox id="connect-to-calendar" checked={newStepConnectToCalendar} onCheckedChange={(checked) => setNewStepConnectToCalendar(!!checked)} /><div className="grid gap-1.5 leading-none"><label htmlFor="connect-to-calendar" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Add to Calendar</label><p className="text-xs text-muted-foreground">Schedules this step as a task in the calendar.</p></div></div>
                        {newStepConnectToCalendar && (
                            <div className="space-y-2 animate-in fade-in-50 duration-300">
                                <Label>Start Date & Time</Label>
                                <div className="flex gap-2">
                                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newStepDate && "text-muted-foreground")}><Calendar className="mr-2 h-4 w-4" />{newStepDate ? format(newStepDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarPicker mode="single" selected={newStepDate} onSelect={setNewStepDate} initialFocus /></PopoverContent></Popover>
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
            </div>
        </div>

        <div className="flex justify-end mt-6">
            <Button size="lg" onClick={handleSaveAndReturn}>
                <Save className="mr-2 h-4 w-4" />
                Save Plan & Return
            </Button>
        </div>
    </div>
  );
}
