

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Plus, Trash2, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjectById, updateProjectWithTasks, type Project, type ProjectStep } from '@/services/project-service';
import { format, set } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

const formatDuration = (totalMinutes: number) => {
    if (totalMinutes < 0) totalMinutes = 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hourString = hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : '';
    const minuteString = minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : '';
    
    if (hourString && minuteString) return `${hourString}, ${minuteString}`;
    return hourString || minuteString || '0 minutes';
};

export function ProjectPlanningView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [steps, setSteps] = useState<Partial<ProjectStep>[]>([]);
    
    const [newStepTitle, setNewStepTitle] = useState("");
    const [newStepDescription, setNewStepDescription] = useState("");
    const [newStepHours, setNewStepHours] = useState<number | ''>(1);
    const [newStepMinutes, setNewStepMinutes] = useState<number | ''>(0);
    const [newStepDate, setNewStepDate] = useState<Date | undefined>(new Date());
    const [newStepHour, setNewStepHour] = useState<string>(String(new Date().getHours()));
    const [newStepMinute, setNewStepMinute] = useState<string>("0");
    const [newStepConnectToCalendar, setNewStepConnectToCalendar] = useState(true);

    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const loadProject = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedProject = await getProjectById(projectId);
            if (fetchedProject) {
                setProject(fetchedProject);
                setSteps(fetchedProject.steps || []);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Project not found.' });
                router.push('/projects');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load project', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [projectId, router, toast]);

    useEffect(() => {
        if (user) {
            loadProject();
        }
    }, [user, loadProject]);
    
    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const date = set(new Date(), { hours: i });
        return { value: String(i), label: format(date, 'h a') };
    });

    const minuteOptions = Array.from({ length: 12 }, (_, i) => {
        const minutes = i * 5;
        return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
    });
    
    const handleAddStep = () => {
        const hours = Number(newStepHours) || 0;
        const minutes = Number(newStepMinutes) || 0;
        const totalDurationMinutes = (hours * 60) + minutes;

        if (!newStepTitle.trim() || totalDurationMinutes <= 0) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title and a duration greater than 0.' });
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
            durationMinutes: totalDurationMinutes,
            isBillable: true,
            connectToCalendar: newStepConnectToCalendar,
            startTime: stepStartTime,
            isCompleted: false,
        };
        
        setSteps(prev => [...prev, newStep]);
        setNewStepTitle("");
        setNewStepDescription("");
        setNewStepHours(1);
        setNewStepMinutes(0);
    };
    
    const handleDeleteStep = (stepId: string) => {
        setSteps(prev => prev.filter(step => step.id !== stepId));
    };
    
    const handleSaveSteps = async () => {
        if (!project || !user) return;
        
        try {
            await updateProjectWithTasks(user.uid, project.id, { steps: steps as ProjectStep[] });
            toast({ title: 'Project Plan Saved', description: 'Your project steps and any associated calendar events have been saved.' });
            router.push('/projects');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
    };
    

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!project) {
        return <div className="p-4">Project not found.</div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="relative text-center">
                 <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    <Button asChild variant="outline">
                        <Link href="/projects">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Projects
                        </Link>
                    </Button>
                </div>
                <h1 className="text-3xl font-bold font-headline text-primary">Project Planning</h1>
                <p className="text-muted-foreground">{project.name}</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Add a New Step</CardTitle>
                        <CardDescription>Define the tasks required to complete this project.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="step-title">Step Title</Label>
                            <Input id="step-title" value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="step-desc">Description</Label>
                            <Textarea id="step-desc" value={newStepDescription} onChange={(e) => setNewStepDescription(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Estimated Duration</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="step-hours" className="text-xs text-muted-foreground">Hours</Label>
                                    <Input id="step-hours" type="number" min="0" value={newStepHours} onChange={(e) => setNewStepHours(Number(e.target.value))} />
                                </div>
                                 <div className="flex-1 space-y-1">
                                    <Label htmlFor="step-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                                    <Input id="step-minutes" type="number" min="0" max="59" step="5" value={newStepMinutes} onChange={(e) => setNewStepMinutes(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox 
                                id="connect-to-calendar" 
                                checked={newStepConnectToCalendar}
                                onCheckedChange={(checked) => setNewStepConnectToCalendar(!!checked)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                htmlFor="connect-to-calendar"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                Add to Calendar
                                </label>
                                <p className="text-xs text-muted-foreground">
                                Schedules this step as a task in the calendar.
                                </p>
                            </div>
                        </div>

                         {newStepConnectToCalendar && (
                            <div className="space-y-2 animate-in fade-in-50 duration-300">
                                <Label>Start Date & Time</Label>
                                <div className="flex gap-2">
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newStepDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newStepDate ? format(newStepDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={newStepDate} onSelect={setNewStepDate} initialFocus /></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={newStepHour} onValueChange={setNewStepHour}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                    <Select value={newStepMinute} onValueChange={setNewStepMinute}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                         )}
                         <Button onClick={handleAddStep} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Step to Plan
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Project Plan</CardTitle>
                        <CardDescription>Review the steps defined for this project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {steps.length > 0 ? (
                           <div className="space-y-4">
                               {steps.map((step, index) => (
                                   <Card key={step.id} className="p-4 flex items-start justify-between">
                                       <div>
                                           <h4 className="font-semibold">{index + 1}. {step.title}</h4>
                                           <p className="text-sm text-muted-foreground">{step.description}</p>
                                           <p className="text-xs text-muted-foreground mt-1">Est. Duration: {formatDuration(step.durationMinutes!)}</p>
                                           {step.connectToCalendar && step.startTime && (
                                                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    Scheduled for {format(step.startTime as Date, 'PPp')}
                                                </p>
                                            )}
                                       </div>
                                       <Button variant="ghost" size="icon" onClick={() => handleDeleteStep(step.id!)}>
                                           <Trash2 className="h-4 w-4 text-destructive" />
                                       </Button>
                                   </Card>
                               ))}
                           </div>
                       ) : (
                           <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                               <p>No steps defined yet.</p>
                               <p className="text-sm">Use the form on the left to add the first step.</p>
                           </div>
                       )}
                    </CardContent>
                    {steps.length > 0 && (
                        <div className="p-6 pt-0">
                            <Button onClick={handleSaveSteps} className="w-full">Save Project Plan</Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
