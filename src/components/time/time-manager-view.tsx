
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderCircle, Save, ChevronsUpDown, Check, Plus, X, Info, Timer, Play, Pause, Trash2, MoreVertical, Edit, MessageSquare, RefreshCw, BellRing, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { type Project, type Event as TaskEvent, type TimeSession } from '@/types/calendar-types';
import { type Contact, type FolderData } from '@/data/contacts';
import { addTask, getProjects, addProject, updateProject, getTaskById, updateTask } from '@/services/project-service';
import { getContacts, getFolders } from '@/services/contact-service';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn, formatTime } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import ContactFormDialog from '@/components/contacts/contact-form-dialog';
import Link from 'next/link';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format as formatDate, set, addMinutes } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';

export interface StoredTimerState {
    eventId: string;
    notes: string;
    isActive: boolean;
    isPaused: boolean;
    startTime: number; // Timestamp
    pauseTime: number | null; // Timestamp
    totalPausedDuration: number; // in seconds
}

const TIMER_STORAGE_KEY = 'activeTimeManagerEntry';

export function TimeManagerView() {
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [contacts, setContacts] = React.useState<Contact[]>([]);
    const [contactFolders, setContactFolders] = React.useState<FolderData[]>([]);
    const [isLoadingData, setIsLoadingData] = React.useState(true);

    // Form state
    const [subject, setSubject] = React.useState("");
    const [notes, setNotes] = React.useState("");
    const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
    const [selectedContactId, setSelectedContactId] = React.useState<string | null>(null);
    const [isBillable, setIsBillable] = React.useState(false);
    const [billableRate, setBillableRate] = React.useState<number | ''>(100);
    
    // State for scheduling
    const [scheduleDate, setScheduleDate] = React.useState<Date | undefined>(undefined);
    const [scheduleHour, setScheduleHour] = React.useState<string | undefined>(undefined);
    const [scheduleMinute, setScheduleMinute] = React.useState<string | undefined>(undefined);

    // State for new client selection UI
    const [isContactPopoverOpen, setIsContactPopoverOpen] = React.useState(false);
    const [clientAction, setClientAction] = React.useState<string>('select');
    const [isContactFormOpen, setIsContactFormOpen] = React.useState(false);

    // New state for project selection UI
    const [isProjectPopoverOpen, setIsProjectPopoverOpen] = React.useState(false);
    const [projectAction, setProjectAction] = React.useState<string>('select');
    const [newProjectName, setNewProjectName] = React.useState('');

    
    const [eventToEdit, setEventToEdit] = React.useState<TaskEvent | null>(null);
    
    // Integrated Detailed Time Tracking State
    const [timerState, setTimerState] = React.useState<StoredTimerState | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
    const [sessions, setSessions] = React.useState<TimeSession[]>([]);
    const [currentSessionNotes, setCurrentSessionNotes] = React.useState('');
    
    // State for editing a session
    const [isEditSessionDialogOpen, setIsEditSessionDialogOpen] = React.useState(false);
    const [sessionToEdit, setSessionToEdit] = React.useState<TimeSession | null>(null);
    const [editSessionHours, setEditSessionHours] = React.useState<number | ''>('');
    const [editSessionMinutes, setEditSessionMinutes] = React.useState<number | ''>('');
    const [editSessionNotes, setEditSessionNotes] = React.useState('');

    const { user } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const hasStartedTimerRef = useRef(false);

    const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: formatDate(set(new Date(), { hours: i }), 'h a') }));
    const minuteOptions = Array.from({ length: 12 }, (_, i) => { const minutes = i * 5; return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` }; });
    
    const createAndSaveNewEvent = useCallback(async (): Promise<TaskEvent | null> => {
        if (!user || !subject.trim()) {
            toast({ variant: 'destructive', title: 'Subject Required', description: 'Please enter a subject before starting the timer.' });
            return null;
        }

        const eventData: Omit<TaskEvent, 'id'> = {
            title: subject,
            description: notes,
            status: 'inProgress',
            position: 0,
            projectId: selectedProjectId,
            contactId: selectedContactId,
            isBillable: isBillable,
            billableRate: isBillable ? Number(billableRate) || 0 : 0,
            userId: user.uid,
        };

        try {
            const newEvent = await addTask(eventData);
            setEventToEdit(newEvent);
            toast({ title: "Event Created", description: `"${newEvent.title}" has been saved and is now being tracked.` });
            return newEvent;
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to create event", description: error.message });
            return null;
        }
    }, [user, subject, notes, selectedProjectId, selectedContactId, isBillable, billableRate, toast]);

    const handleStartTimer = useCallback(async () => {
        let currentEvent = eventToEdit;
        if (!currentEvent) {
            currentEvent = await createAndSaveNewEvent();
        }

        if (currentEvent) {
            const now = Date.now();
            const storedState: StoredTimerState = {
                eventId: currentEvent.id,
                notes: currentEvent.title,
                isActive: true,
                isPaused: false,
                startTime: now,
                pauseTime: null,
                totalPausedDuration: 0,
            };
            localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(storedState));
            window.dispatchEvent(new Event('storage'));
        }
    }, [eventToEdit, createAndSaveNewEvent]);
    
    const handlePauseTimer = useCallback(() => {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (savedStateRaw) {
            const savedState: StoredTimerState = JSON.parse(savedStateRaw);
            if (savedState.isActive && !savedState.isPaused) {
                const newState = { ...savedState, isPaused: true, pauseTime: Date.now() };
                localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(newState));
                window.dispatchEvent(new Event('storage'));
            }
        }
    }, []);

    const handleResumeTimer = useCallback(() => {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (savedStateRaw) {
            const savedState: StoredTimerState = JSON.parse(savedStateRaw);
            if (savedState.isActive && savedState.isPaused) {
                const pausedDuration = Math.floor((Date.now() - savedState.pauseTime!) / 1000);
                const newState: StoredTimerState = {
                    ...savedState,
                    isPaused: false,
                    pauseTime: null,
                    totalPausedDuration: savedState.totalPausedDuration + pausedDuration,
                };
                localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(newState));
                window.dispatchEvent(new Event('storage'));
            }
        }
    }, []);

    const handleLogCurrentSession = () => {
        if (!timerState || !timerState.isActive || elapsedSeconds <= 0) {
            toast({ variant: 'destructive', title: 'No Time to Log', description: 'The timer is not running or has no elapsed time.' });
            return;
        }

        const newSession: TimeSession = {
            id: `session_${Date.now()}`,
            startTime: new Date(timerState.startTime),
            endTime: new Date(),
            durationSeconds: elapsedSeconds,
            notes: currentSessionNotes,
        };

        setSessions(prev => [...prev, newSession]);
        setCurrentSessionNotes('');

        // Reset the timer in localStorage
        localStorage.removeItem(TIMER_STORAGE_KEY);
        window.dispatchEvent(new Event('storage'));
        toast({ title: 'Session Logged', description: `${formatTime(elapsedSeconds)} has been logged.` });
    };

    const handleOpenEditSession = (session: TimeSession) => {
        setSessionToEdit(session);
        const hours = Math.floor(session.durationSeconds / 3600);
        const minutes = Math.floor((session.durationSeconds % 3600) / 60);
        setEditSessionHours(hours);
        setEditSessionMinutes(minutes);
        setEditSessionNotes(session.notes || '');
        setIsEditSessionDialogOpen(true);
    };

    const handleSaveSession = () => {
        if (!sessionToEdit) return;

        const hours = Number(editSessionHours) || 0;
        const minutes = Number(editSessionMinutes) || 0;
        const newDurationSeconds = (hours * 3600) + (minutes * 60);

        if (newDurationSeconds <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Duration', description: 'Duration must be greater than zero.'});
            return;
        }

        const updatedSession = { ...sessionToEdit, durationSeconds: newDurationSeconds, notes: editSessionNotes };
        setSessions(prev => prev.map(s => s.id === sessionToEdit.id ? updatedSession : s));
        setIsEditSessionDialogOpen(false);
    };

    const loadData = useCallback(async () => {
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
            
            const eventIdParam = searchParams.get('eventId');
            if (eventIdParam) {
                const eventData = await getTaskById(eventIdParam);
                if (eventData) {
                    setEventToEdit(eventData);
                    setSubject(eventData.title);
                    setNotes(eventData.description || "");
                    setSelectedProjectId(eventData.projectId || null);
                    setSelectedContactId(eventData.contactId || null);
                    setIsBillable(eventData.isBillable || false);
                    setBillableRate(eventData.billableRate || 0);
                    setSessions(eventData.sessions || []);
                    if (eventData.start) {
                        const startDate = new Date(eventData.start);
                        setScheduleDate(startDate);
                        setScheduleHour(String(startDate.getHours()));
                        setScheduleMinute(String(startDate.getMinutes()));
                    }
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not load event data.' });
                }
            } else {
                 const title = searchParams.get('title');
                 const notes = searchParams.get('notes');
                 const contactId = searchParams.get('contactId');
                 const projectId = searchParams.get('projectId');
                 if (title) setSubject(title);
                 if (notes) setNotes(notes);
                 if (contactId) setSelectedContactId(contactId);
                 if (projectId) setSelectedProjectId(projectId);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
        } finally {
            setIsLoadingData(false);
        }
    }, [user, searchParams, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    // This effect handles the startTimer URL parameter
    useEffect(() => {
        const startTimerParam = searchParams.get('startTimer');
        if (startTimerParam === 'true' && eventToEdit && !hasStartedTimerRef.current) {
            hasStartedTimerRef.current = true; // Prevents re-triggering
            handleStartTimer();
        }
    }, [searchParams, eventToEdit, handleStartTimer]);

    const syncWithGlobalTimer = useCallback(() => {
        try {
            const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
            if (savedStateRaw) {
                const savedState: StoredTimerState = JSON.parse(savedStateRaw);
                // Only sync if the timer belongs to the event being edited
                if (eventToEdit && savedState.eventId === eventToEdit.id) {
                    setTimerState(savedState);
                    if (savedState.isActive) {
                        const now = Date.now();
                        const pausedDuration = savedState.isPaused ? Math.floor((now - savedState.pauseTime!) / 1000) : 0;
                        const elapsed = Math.floor((now - savedState.startTime) / 1000) - savedState.totalPausedDuration - pausedDuration;
                        setElapsedSeconds(elapsed > 0 ? elapsed : 0);
                    }
                } else {
                    setTimerState(null);
                    setElapsedSeconds(0);
                }
            } else {
                setTimerState(null);
                setElapsedSeconds(0);
            }
        } catch (e) {
            console.error("Error syncing with global timer:", e);
        }
    }, [eventToEdit]);
    
    useEffect(() => {
        syncWithGlobalTimer();
        window.addEventListener('storage', syncWithGlobalTimer);
        const interval = setInterval(syncWithGlobalTimer, 1000);
        return () => {
            window.removeEventListener('storage', syncWithGlobalTimer);
            clearInterval(interval);
        };
    }, [syncWithGlobalTimer]);

    const totalAccumulatedSeconds = useMemo(() => {
        return sessions.reduce((acc, session) => acc + session.durationSeconds, 0);
    }, [sessions]);

    const totalTime = useMemo(() => {
        return totalAccumulatedSeconds + elapsedSeconds;
    }, [totalAccumulatedSeconds, elapsedSeconds]);

    const handleSaveEvent = async () => {
        if (!user || !subject.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter a subject for the event.' });
            return;
        }

        let start: Date | null = new Date();
        let end: Date | null = new Date(start.getTime() + 30 * 60000); // Default 30 min duration
        let isScheduled = false;

        if (scheduleDate) {
            const hour = scheduleHour ? parseInt(scheduleHour) : new Date().getHours();
            const minute = scheduleMinute ? parseInt(scheduleMinute) : new Date().getMinutes();
            start = set(scheduleDate, { hours: hour, minutes: minute });
            end = addMinutes(start, 30); // Default duration if not otherwise specified
            isScheduled = true;
        }

        const eventData: Partial<Omit<TaskEvent, 'id' | 'userId'>> = {
            title: subject,
            description: notes,
            start,
            end,
            isScheduled,
            status: isScheduled ? 'todo' : 'inProgress',
            projectId: selectedProjectId,
            contactId: selectedContactId,
            duration: totalTime,
            sessions: sessions,
            isBillable: isBillable,
            billableRate: isBillable ? (Number(billableRate) || 0) : 0,
        };

        try {
            if (eventToEdit) {
                await updateTask(eventToEdit.id, eventData);
                toast({ title: "Event Updated", description: `"${eventData.title}" has been saved.` });
            } else {
                const newEvent = await addTask({ ...eventData as Omit<TaskEvent, 'id'>, userId: user.uid });
                setEventToEdit(newEvent);
                toast({ title: "Event Saved", description: `"${newEvent.title}" has been saved.` });
            }
            router.back();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to save event', description: error.message });
        }
    };
    
    const handleContactSave = (contact: Contact, isEditing: boolean) => {
        if (isEditing) {
            setContacts(prev => prev.map(c => c.id === contact.id ? contact : c));
        } else {
            setContacts(prev => [...prev, contact]);
        }
        setSelectedContactId(contact.id);
        setClientAction('select');
    };

    const handleCreateProject = async () => {
        if (!user || !newProjectName.trim()) {
            toast({ variant: 'destructive', title: 'Project name is required.' });
            return;
        }
        try {
            const newProject = await addProject({
                name: newProjectName,
                userId: user.uid,
                status: 'planning',
                createdAt: new Date(),
            });
            setProjects(prev => [newProject, ...prev]);
            setSelectedProjectId(newProject.id);
            setProjectAction('select');
            setNewProjectName('');
            toast({ title: 'Project Created', description: `Project "${newProject.name}" has been added.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to create project", description: error.message });
        }
    };
    
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
                <header className="w-full max-w-5xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center justify-start gap-2">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" onClick={handleSaveEvent}>
                                            <Save className="mr-2 h-4 w-4" /> Save
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Save Event</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold font-headline text-primary whitespace-nowrap">Task &amp; Event Manager</h1>
                            <p className="text-muted-foreground whitespace-nowrap">Your ‘Master Mind’ for getting things done.</p>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href="/master-mind/instructions">
                                                <Info className="h-5 w-5 text-muted-foreground" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>How to use this manager</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="w-full max-w-4xl space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject Title <span className="text-destructive">*</span></Label>
                                <Input id="subject" placeholder="What is the main task or event?" value={subject} onChange={(e) => setSubject(e.target.value)} />
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
                                                        <Button variant="outline" role="combobox" className="w-full justify-between mt-2">
                                                            {selectedContactId ? contacts.find(c => c.id === selectedContactId)?.name : "Select client..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                        <Command><CommandInput placeholder="Search clients..." /><CommandList><CommandEmpty>No client found.</CommandEmpty><CommandGroup>{contacts.map(c => (<CommandItem key={c.id} value={c.name} onSelect={() => { setSelectedContactId(c.id); setIsContactPopoverOpen(false); }}> <Check className={cn("mr-2 h-4 w-4", selectedContactId === c.id ? "opacity-100" : "opacity-0")}/>{c.name}</CommandItem>))}</CommandGroup></CommandList></Command>
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                <Button variant="outline" onClick={() => setIsContactFormOpen(true)} className="w-full mt-2">
                                                    <Plus className="mr-2 h-4 w-4" /> Create New Contact
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="p-4"><CardTitle className="text-base">Select or Create a Project</CardTitle></CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="space-y-2">
                                            <RadioGroup onValueChange={(value) => setProjectAction(value)} value={projectAction} className="flex space-x-4">
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="select" id="select-project" /><Label htmlFor="select-project">Select/Search</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="add" id="add-project" /><Label htmlFor="add-project">Add New</Label></div>
                                            </RadioGroup>

                                            {projectAction === 'select' ? (
                                                <Popover open={isProjectPopoverOpen} onOpenChange={setIsProjectPopoverOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" role="combobox" className="w-full justify-between mt-2">
                                                            {selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : "Select project..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                        <Command><CommandInput placeholder="Search projects..." /><CommandList><CommandEmpty>No project found.</CommandEmpty><CommandGroup>{projects.map(p => (<CommandItem key={p.id} value={p.name} onSelect={() => { setSelectedProjectId(p.id); setIsProjectPopoverOpen(false); }}> <Check className={cn("mr-2 h-4 w-4", selectedProjectId === p.id ? "opacity-100" : "opacity-0")}/>{p.name}</CommandItem>))}</CommandGroup></CommandList></Command>
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Input
                                                        placeholder="Enter new project name..."
                                                        value={newProjectName}
                                                        onChange={e => setNewProjectName(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                                                    />
                                                    <Button onClick={handleCreateProject}><Plus className="mr-2 h-4 w-4"/> Create</Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes / Details</Label>
                                <Textarea id="notes" placeholder="Add more details about the work..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Schedule (Optional)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                             <div className="flex flex-col sm:flex-row gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {scheduleDate ? formatDate(scheduleDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} initialFocus /></PopoverContent>
                                </Popover>
                                <div className="flex-1 flex gap-2">
                                    <Select value={scheduleHour} onValueChange={setScheduleHour}><SelectTrigger><SelectValue placeholder="Hour" /></SelectTrigger><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                    <Select value={scheduleMinute} onValueChange={setScheduleMinute}><SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Time Log</CardTitle>
                            <CardDescription>Start a timer to log time for this event and edit logged sessions as needed.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                            <div className="space-y-4 p-4 border rounded-lg bg-background">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                         <Button onClick={handleStartTimer} disabled={timerState?.isActive && !timerState.isPaused} className="bg-green-600 hover:bg-green-700"><Play className="mr-2 h-4 w-4"/> Start New Session</Button>
                                         <Button onClick={handlePauseTimer} disabled={!timerState?.isActive || timerState.isPaused} variant="destructive" className="bg-orange-500 hover:bg-orange-600"><Pause className="mr-2 h-4 w-4"/> Pause Session</Button>
                                         <Button onClick={handleResumeTimer} disabled={!timerState?.isActive || !timerState.isPaused} variant="outline"><Play className="mr-2 h-4 w-4"/> Resume Session</Button>
                                    </div>
                                    <div className="text-right">
                                        <Label className="text-xs">Current Session</Label>
                                        <div className="font-mono text-2xl font-bold">{formatTime(elapsedSeconds)}</div>
                                    </div>
                                     <div className="text-right">
                                        <Label className="text-xs">Total Logged Time</Label>
                                        <p className="font-mono text-lg font-bold text-primary">{formatTime(totalTime)}</p>
                                    </div>
                                </div>
                                {timerState?.isActive && (
                                    <div className="space-y-2 animate-in fade-in-50 duration-300">
                                        <Label htmlFor="session-notes">Session Notes</Label>
                                        <Textarea id="session-notes" placeholder="What are you working on right now?" value={currentSessionNotes} onChange={(e) => setCurrentSessionNotes(e.target.value)} />
                                        <Button size="sm" onClick={handleLogCurrentSession}>Log Session</Button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Logged Sessions</Label>
                                <ScrollArea className="h-24 w-full rounded-md border bg-background">
                                   <ScrollBar forceMount />
                                   <div className="p-2">{sessions.length > 0 ? (sessions.map((session, index) => (<div key={session.id} className="p-2 rounded-md hover:bg-muted/50 group"><div className="flex items-center justify-between"><p className="font-medium text-sm">Session {index + 1}</p><div className="flex items-center gap-4"><span className="font-mono text-sm">{formatTime(session.durationSeconds)}</span><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => handleOpenEditSession(session)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => setSessions(prev => prev.filter(s => s.id !== session.id))}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>{session.notes && <p className="text-xs text-muted-foreground mt-1 pl-2 whitespace-pre-wrap">{session.notes}</p>}</div>))) : (<div className="text-center text-sm text-muted-foreground p-4">No sessions logged yet.</div>)}</div>
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
             <Dialog open={isEditSessionDialogOpen} onOpenChange={setIsEditSessionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Time Session</DialogTitle>
                        <DialogDescription>Adjust the duration and add notes for this session.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Duration</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="edit-hours" className="text-xs">Hours</Label>
                                    <Input id="edit-hours" type="number" value={editSessionHours} onChange={(e) => setEditSessionHours(e.target.value === '' ? '' : Number(e.target.value))} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="edit-minutes" className="text-xs">Minutes</Label>
                                    <Input id="edit-minutes" type="number" value={editSessionMinutes} onChange={(e) => setEditSessionMinutes(e.target.value === '' ? '' : Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-notes">Notes</Label>
                            <Textarea id="edit-notes" value={editSessionNotes} onChange={(e) => setEditSessionNotes(e.target.value)} placeholder="Add a description of the work done during this session..." className="border-2 border-black" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditSessionDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSession}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}


    