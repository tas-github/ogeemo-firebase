
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, Pause, Square, LoaderCircle, Save, Calendar as CalendarIcon, ChevronsUpDown, Check, Plus, X, Briefcase } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { type Project, type Event as TaskEvent } from '@/types/calendar-types';
import { type Contact, type FolderData } from '@/data/contacts';
import { addTask, getProjects, addProject, updateProject, getTaskById, updateTask } from '@/services/project-service';
import { getContacts, getFolders } from '@/services/contact-service';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format, set, addMinutes, parseISO, differenceInSeconds } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import ContactFormDialog from '@/components/contacts/contact-form-dialog';
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog';
import Link from 'next/link';


const TIMER_STORAGE_KEY = 'activeTimeManagerEntry';

interface StoredTimerState {
    startTime: number;
    isActive: boolean;
    isPaused: boolean;
    pauseTime: number | null;
    totalPausedDuration: number;
    projectId: string | null;
    contactId: string | null;
    subject: string;
    notes: string;
    isBillable: boolean;
    billableRate: number;
}

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function TimeManagerView() {
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [contacts, setContacts] = React.useState<Contact[]>([]);
    const [contactFolders, setContactFolders] = React.useState<FolderData[]>([]);
    const [isLoadingData, setIsLoadingData] = React.useState(true);

    const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
    const [isActive, setIsActive] = React.useState(false);
    const [isPaused, setIsPaused] = React.useState(false);
    
    // Form state
    const [subject, setSubject] = React.useState("");
    const [notes, setNotes] = React.useState("");
    const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
    const [selectedContactId, setSelectedContactId] = React.useState<string | null>(null);
    const [isBillable, setIsBillable] = React.useState(true);
    const [billableRate, setBillableRate] = React.useState<number | ''>(100);
    
    // State for scheduling
    const [scheduleDate, setScheduleDate] = React.useState<Date | undefined>(new Date());
    const [scheduleHour, setScheduleHour] = React.useState<string>(String(new Date().getHours()));
    const [scheduleMinute, setScheduleMinute] = React.useState<string>("0");
    const [durationHours, setDurationHours] = React.useState<number|''> (1);
    const [durationMinutes, setDurationMinutes] = React.useState<number|''> (0);

    // State for new client selection UI
    const [isContactPopoverOpen, setIsContactPopoverOpen] = React.useState(false);
    const [clientAction, setClientAction] = React.useState<string>('select');
    const [isContactFormOpen, setIsContactFormOpen] = React.useState(false);

    // New state for project selection UI
    const [isProjectPopoverOpen, setIsProjectPopoverOpen] = React.useState(false);
    const [projectAction, setProjectAction] = React.useState<string>('select');
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = React.useState(false);
    
    const [eventToEdit, setEventToEdit] = React.useState<TaskEvent | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Pre-populate form from URL params
    React.useEffect(() => {
        const loadEventToEdit = async () => {
            const eventIdParam = searchParams.get('eventId');
            if (!eventIdParam) return;
            try {
                const eventData = await getTaskById(eventIdParam);
                if (eventData) {
                    setEventToEdit(eventData);
                    setSubject(eventData.title);
                    setNotes(eventData.description || "");
                    setSelectedProjectId(eventData.projectId || null);
                    setSelectedContactId(eventData.contactId || null);
                    setIsBillable(eventData.isBillable || false);
                    setBillableRate(eventData.billableRate || 0);
                    if (eventData.start) {
                        setScheduleDate(eventData.start);
                        setScheduleHour(String(eventData.start.getHours()));
                        setScheduleMinute(String(eventData.start.getMinutes()));
                    }
                    if (eventData.duration) {
                        const hours = Math.floor(eventData.duration / 3600);
                        const minutes = Math.floor((eventData.duration % 3600) / 60);
                        setDurationHours(hours);
                        setDurationMinutes(minutes);
                    }
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load event data.' });
            }
        };

        const projectIdParam = searchParams.get('projectId');
        const dateParam = searchParams.get('date');
        const hourParam = searchParams.get('hour');
        const minuteParam = searchParams.get('minute');
        if (projectIdParam) setSelectedProjectId(projectIdParam);
        if (dateParam) setScheduleDate(parseISO(dateParam));
        if (hourParam) setScheduleHour(hourParam);
        if (minuteParam) setScheduleMinute(minuteParam);
        
        loadEventToEdit();
    }, [searchParams, toast]);

    React.useEffect(() => {
        async function loadData() {
            if (!user) {
                setIsLoadingData(false);
                return;
            }
            setIsLoadingData(true);
            try {
                const [fetchedProjects, fetchedContacts, fetchedFolders] = await Promise.all([
                    getProjects(user.uid),
                    getContacts(user.uid),
                    getFolders(user.uid),
                ]);
                setProjects(fetchedProjects);
                setContacts(fetchedContacts);
                setContactFolders(fetchedFolders);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
            } finally {
                setIsLoadingData(false);
            }
        }
        loadData();
    }, [user, toast]);

    const updateTimerState = React.useCallback(() => {
        try {
            const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
            if (savedStateRaw) {
                const savedState: StoredTimerState = JSON.parse(savedStateRaw);
                if (savedState.isActive) {
                    setIsActive(true);
                    setIsPaused(savedState.isPaused);
                    setSubject(savedState.subject);
                    setNotes(savedState.notes);
                    setSelectedProjectId(savedState.projectId);
                    setSelectedContactId(savedState.contactId);
                    setIsBillable(savedState.isBillable);
                    setBillableRate(savedState.billableRate);

                    if (!savedState.isPaused) {
                        const now = Date.now();
                        const elapsed = Math.floor((now - savedState.startTime) / 1000) - savedState.totalPausedDuration;
                        setElapsedSeconds(elapsed > 0 ? elapsed : 0);
                    } else {
                        const elapsed = Math.floor((savedState.pauseTime! - savedState.startTime) / 1000) - savedState.totalPausedDuration;
                        setElapsedSeconds(elapsed > 0 ? elapsed : 0);
                    }
                } else {
                    setIsActive(false);
                }
            } else {
                setIsActive(false);
                setElapsedSeconds(0);
            }
        } catch (e) {
            console.error("Error reading timer state", e);
            setIsActive(false);
        }
    }, []);

    React.useEffect(() => {
        updateTimerState();
        window.addEventListener('storage', updateTimerState);
        const interval = setInterval(updateTimerState, 1000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', updateTimerState);
        };
    }, [updateTimerState]);

    const handleStartTimer = () => {
        if (!subject.trim()) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please enter a subject to start the timer.',
            });
            return;
        }
        const now = Date.now();
        const state: StoredTimerState = {
            startTime: now,
            isActive: true,
            isPaused: false,
            pauseTime: null,
            totalPausedDuration: 0,
            projectId: selectedProjectId,
            contactId: selectedContactId,
            subject,
            notes,
            isBillable,
            billableRate: isBillable ? (Number(billableRate) || 0) : 0,
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new Event('storage'));
    };

    const handlePauseTimer = () => {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (!savedStateRaw) return;
        const savedState: StoredTimerState = JSON.parse(savedStateRaw);
        savedState.isPaused = true;
        savedState.pauseTime = Date.now();
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(savedState));
        window.dispatchEvent(new Event('storage'));
    };
    
    const handleResumeTimer = () => {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (!savedStateRaw) return;
        const savedState: StoredTimerState = JSON.parse(savedStateRaw);
        if (savedState.pauseTime) {
            savedState.totalPausedDuration += Math.floor((Date.now() - savedState.pauseTime) / 1000);
        }
        savedState.isPaused = false;
        savedState.pauseTime = null;
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(savedState));
        window.dispatchEvent(new Event('storage'));
    };

    const handleReset = (showToast = true) => {
        setElapsedSeconds(0);
        setSubject("");
        setNotes("");
        setSelectedContactId(null);
        setSelectedProjectId(searchParams.get('projectId') || null);
        setIsBillable(true);
        setBillableRate(100);
        setEventToEdit(null);
        // Clear eventId from URL
        router.push(window.location.pathname, { scroll: false });
        localStorage.removeItem(TIMER_STORAGE_KEY);
        window.dispatchEvent(new Event('storage'));
        if (showToast) {
            toast({ title: 'Timer Reset', description: 'The timer and fields have been cleared.' });
        }
    }

    const handleLogTime = async () => {
        if (!user || elapsedSeconds <= 0) return;
        
        const contact = contacts.find(c => c.id === selectedContactId);
        
        const newTaskData: Omit<TaskEvent, 'id' | 'userId'> = {
            title: subject || 'Logged Time Entry',
            description: notes,
            start: new Date(Date.now() - elapsedSeconds * 1000),
            end: new Date(),
            status: 'done',
            position: 0,
            projectId: selectedProjectId,
            contactId: selectedContactId,
            isScheduled: true,
            duration: elapsedSeconds,
            isBillable,
            billableRate: isBillable ? (Number(billableRate) || 0) : 0,
            attendees: ['You'],
        };
        
        try {
            await addTask({ ...newTaskData, userId: user.uid });
            toast({ title: 'Time Logged', description: `Logged ${formatTime(elapsedSeconds)} as a completed task for ${contact?.name || 'Unassigned'}` });
            handleReset(false);
            window.dispatchEvent(new Event('tasksUpdated'));
            router.push('/calendar');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Log Failed', description: error.message });
        }
    };
    
    const updateStoredState = (key: keyof StoredTimerState, value: any) => {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (savedStateRaw) {
            const savedState: StoredTimerState = JSON.parse(savedStateRaw);
            (savedState as any)[key] = value;
            localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(savedState));
            window.dispatchEvent(new Event('storage'));
        }
    };

    const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSubject = e.target.value;
        setSubject(newSubject);
        if(isActive) updateStoredState('subject', newSubject);
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNotes = e.target.value;
        setNotes(newNotes);
        if(isActive) updateStoredState('notes', newNotes);
    };
    
    const handleIsBillableChange = (checked: boolean | 'indeterminate') => {
        const newIsBillable = !!checked;
        setIsBillable(newIsBillable);
        if(isActive) {
            updateStoredState('isBillable', newIsBillable);
            if (!newIsBillable) {
                updateStoredState('billableRate', 0);
            }
        }
    };

    const handleBillableRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRate = e.target.value === '' ? '' : Number(e.target.value);
        setBillableRate(newRate);
        if(isActive) updateStoredState('billableRate', Number(newRate) || 0);
    };
    
    const handleProjectChange = (projectId: string) => {
        setSelectedProjectId(projectId);
        if(isActive) updateStoredState('projectId', projectId);
    };

    const handleContactChange = (contactId: string) => {
        setSelectedContactId(contactId);
        if(isActive) updateStoredState('contactId', contactId);
    };

    const handleScheduleEvent = async () => {
        if (!user || !subject.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter a subject for the event.' });
            return;
        }

        if (!scheduleDate) {
            toast({ variant: 'destructive', title: 'Missing Date/Time', description: 'Please select a date and time for the event.' });
            return;
        }
        
        const startDateTime = set(scheduleDate, { hours: parseInt(scheduleHour), minutes: parseInt(scheduleMinute) });
        const durationInMinutes = (Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);
        const endDateTime = addMinutes(startDateTime, durationInMinutes);
        const duration = (endDateTime.getTime() - startDateTime.getTime()) / 1000;
        
        const eventData: Partial<Omit<TaskEvent, 'id' | 'userId'>> = {
            title: subject,
            description: notes,
            start: startDateTime,
            end: endDateTime,
            status: 'todo',
            position: 0,
            projectId: selectedProjectId,
            contactId: selectedContactId,
            isScheduled: true,
            duration,
            isBillable,
            billableRate: isBillable ? (Number(billableRate) || 0) : 0,
            attendees: ['You'],
        };

        try {
            if (eventToEdit) {
                await updateTask(eventToEdit.id, eventData);
                toast({ title: "Event Updated", description: `"${eventData.title}" has been saved.` });
            } else {
                await addTask({ ...eventData as Omit<TaskEvent, 'id'>, userId: user.uid });
                toast({ title: "Event Scheduled", description: `"${eventData.title}" has been saved.` });
            }
            handleReset(false);
            window.dispatchEvent(new Event('tasksUpdated'));
            router.push('/calendar');
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Failed to create event', description: error.message });
        }
    };
    
    const handleContactSave = (contact: Contact, isEditing: boolean) => {
        if (isEditing) {
            setContacts(prev => prev.map(c => c.id === contact.id ? contact : c));
        } else {
            setContacts(prev => [...prev, contact]);
        }
        handleContactChange(contact.id);
        setClientAction('select');
    };

    const handleProjectCreated = (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: Omit<TaskEvent, 'id'|'userId'|'projectId'>[]) => {
        if (!user) return;
        addProject({ ...projectData, userId: user.uid, createdAt: new Date() })
            .then(newProject => {
                setProjects(prev => [newProject, ...prev]);
                handleProjectChange(newProject.id);
                setProjectAction('select');
                toast({ title: 'Project Created', description: `Project "${newProject.name}" has been added.` });
            })
            .catch(err => toast({ variant: 'destructive', title: 'Creation Failed', description: err.message }));
    };

    const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: format(set(new Date(), { hours: i }), 'h a') }));
    const minuteOptions = Array.from({ length: 12 }, (_, i) => { const minutes = i * 5; return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` }; });


    if (isLoadingData) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="p-4 sm:p-6 space-y-6 flex flex-col items-center">
                <header className="w-full max-w-4xl">
                    <div className="flex justify-between items-center">
                        <div className="flex-1" />
                        <div className="flex-1 text-center">
                            <h1 className="text-2xl font-bold font-headline text-primary">Time &amp; Task Manager</h1>
                            <p className="text-muted-foreground">
                                Your hub for time tracking, logging work, and scheduling tasks.
                            </p>
                        </div>
                        <div className="flex-1 text-right flex items-center justify-end gap-2">
                            {eventToEdit && eventToEdit.projectId && (
                                <Button asChild variant="outline">
                                    <Link href={`/projects/${eventToEdit.projectId}/tasks`}>
                                        <Briefcase className="mr-2 h-4 w-4" /> Go to Project
                                    </Link>
                                </Button>
                            )}
                            <div>
                                <p className="text-muted-foreground text-sm">Time Logged</p>
                                <p className="text-2xl font-mono font-bold text-primary tracking-tighter">
                                    {formatTime(elapsedSeconds)}
                                </p>
                            </div>
                            <Button asChild variant="ghost" size="icon">
                                <Link href="/calendar">
                                    <X className="h-5 w-5" />
                                    <span className="sr-only">Close and go to Calendar</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <Card className="w-full max-w-4xl">
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject Title <span className="text-destructive">*</span></Label>
                            <Input id="subject" placeholder="What is the main task?" value={subject} onChange={handleSubjectChange} />
                            <p className="text-xs text-muted-foreground">A subject is required to start the timer.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="p-4"><CardTitle className="text-base">Select a Client</CardTitle></CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="space-y-2">
                                        <RadioGroup onValueChange={(value) => setClientAction(value)} value={clientAction} className="flex space-x-4">
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="select" id="select-client" /><Label htmlFor="select-client">Select/Search</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="add" id="add-client" /><Label htmlFor="add-client">Add New</Label></div>
                                        </RadioGroup>

                                        {clientAction === 'select' ? (
                                            <Popover open={isContactPopoverOpen} onOpenChange={setIsContactPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" role="combobox" className="w-full justify-between mt-2" disabled={isActive}>
                                                        {selectedContactId ? contacts.find(c => c.id === selectedContactId)?.name : "Select client..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command><CommandInput placeholder="Search clients..." /><CommandList><CommandEmpty>No client found.</CommandEmpty><CommandGroup>{contacts.map(c => (<CommandItem key={c.id} value={c.name} onSelect={() => { handleContactChange(c.id); setIsContactPopoverOpen(false); }}> <Check className={cn("mr-2 h-4 w-4", selectedContactId === c.id ? "opacity-100" : "opacity-0")}/>{c.name}</CommandItem>))}</CommandGroup></CommandList></Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <Button variant="outline" onClick={() => setIsContactFormOpen(true)} className="w-full mt-2" disabled={isActive}>
                                                <Plus className="mr-2 h-4 w-4" /> Create New Contact
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="p-4"><CardTitle className="text-base">Select a Project</CardTitle></CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="space-y-2">
                                        <RadioGroup onValueChange={(value) => setProjectAction(value)} value={projectAction} className="flex space-x-4">
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="select" id="select-project" /><Label htmlFor="select-project">Select/Search</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="add" id="add-project" /><Label htmlFor="add-project">Add New</Label></div>
                                        </RadioGroup>

                                        {projectAction === 'select' ? (
                                            <Popover open={isProjectPopoverOpen} onOpenChange={setIsProjectPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" role="combobox" className="w-full justify-between mt-2" disabled={isActive}>
                                                        {selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : "Select project..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command><CommandInput placeholder="Search projects..." /><CommandList><CommandEmpty>No project found.</CommandEmpty><CommandGroup>{projects.map(p => (<CommandItem key={p.id} value={p.name} onSelect={() => { handleProjectChange(p.id); setIsProjectPopoverOpen(false); }}> <Check className={cn("mr-2 h-4 w-4", selectedProjectId === p.id ? "opacity-100" : "opacity-0")}/>{p.name}</CommandItem>))}</CommandGroup></CommandList></Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(true)} className="w-full mt-2" disabled={isActive}>
                                                <Plus className="mr-2 h-4 w-4" /> Create New Project
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes / Details</Label>
                            <Textarea id="notes" placeholder="Add more details about the work..." value={notes} onChange={handleNotesChange} rows={4} />
                        </div>
                        
                        <div className="space-y-4 p-4 border rounded-md">
                            <Label>Schedule for Later (*Required)</Label>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="space-y-2 flex-1 w-full">
                                    <Label className="text-xs">Start Time</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")} disabled={isActive}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {scheduleDate ? `${format(scheduleDate, "PPP")}, ${format(set(new Date(), { hours: parseInt(scheduleHour), minutes: parseInt(scheduleMinute)}), 'p')}` : <span>Pick a date & time</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} initialFocus />
                                            <div className="p-2 border-t border-border flex gap-2">
                                                <Select value={scheduleHour} onValueChange={setScheduleHour}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                                <Select value={scheduleMinute} onValueChange={setScheduleMinute}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2 w-full sm:w-auto">
                                    <Label className="text-xs">Duration</Label>
                                    <div className="flex items-center gap-2">
                                        <Input type="number" placeholder="Hrs" value={durationHours} onChange={e => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))} disabled={isActive} className="w-20" />
                                        <Input type="number" placeholder="Mins" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))} step="5" disabled={isActive} className="w-20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="is-billable" checked={isBillable} onCheckedChange={handleIsBillableChange} />
                                <Label htmlFor="is-billable" className="font-medium">Billable</Label>
                            </div>
                            {isBillable && (
                                <div className="space-y-2 w-48 animate-in fade-in-50 duration-300">
                                    <Label htmlFor="billable-rate">Rate ($/hr)</Label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                                        <Input id="billable-rate" type="number" placeholder="100" value={billableRate} onChange={handleBillableRateChange} className="pl-7" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex gap-2">
                            {!isActive ? (
                                <>
                                <Button size="lg" onClick={handleStartTimer}>
                                    <Play className="mr-2 h-5 w-5" /> Start Timer Now
                                </Button>
                                <Button size="lg" variant="outline" onClick={handleScheduleEvent}>
                                    <Save className="mr-2 h-5 w-5" /> {eventToEdit ? 'Update Event' : 'Save Event'}
                                </Button>
                                </>
                            ) : (
                                <>
                                <Button size="lg" variant="outline" onClick={isPaused ? handleResumeTimer : handlePauseTimer}>
                                    {isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button size="lg" variant="destructive" onClick={handleLogTime}>
                                    <Square className="mr-2 h-5 w-5" /> Stop &amp; Log Time
                                </Button>
                                </>
                            )}
                        </div>
                        <Button variant="ghost" onClick={() => handleReset()}>Reset</Button>
                    </CardFooter>
                </Card>
            </div>
            {isContactFormOpen && (
                <ContactFormDialog 
                    isOpen={isContactFormOpen}
                    onOpenChange={setIsContactFormOpen}
                    contactToEdit={null}
                    folders={contactFolders}
                    onSave={handleContactSave}
                />
            )}
            {isNewProjectDialogOpen && (
                <NewTaskDialog
                    isOpen={isNewProjectDialogOpen}
                    onOpenChange={setIsNewProjectDialogOpen}
                    onProjectCreate={handleProjectCreated}
                    contacts={contacts}
                />
            )}
        </>
    );
}
