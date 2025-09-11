
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderCircle, Save, Calendar as CalendarIcon, ChevronsUpDown, Check, Plus, X, Briefcase, Info, Timer, PlayCircle, Clock, Square, Pause, Play, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { type Project, type Event as TaskEvent, type TimeSession } from '@/types/calendar-types';
import { type Contact, type FolderData } from '@/data/contacts';
import { addTask, getProjects, addProject, updateProject, getTaskById, updateTask } from '@/services/project-service';
import { getContacts, getFolders } from '@/services/contact-service';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn, formatTime } from '@/lib/utils';
import { format, set, addMinutes, parseISO } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import ContactFormDialog from '@/components/contacts/contact-form-dialog';
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog';
import Link from 'next/link';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED';

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
    const [isBillable, setIsBillable] = React.useState(true);
    const [billableRate, setBillableRate] = React.useState<number | ''>(100);
    
    // State for scheduling
    const [scheduleDate, setScheduleDate] = React.useState<Date | undefined>(new Date());
    const [scheduleHour, setScheduleHour] = React.useState<string | undefined>(String(new Date().getHours()));
    const [scheduleMinute, setScheduleMinute] = React.useState<string | undefined>(String(Math.floor(new Date().getMinutes() / 5) * 5));

    // State for new client selection UI
    const [isContactPopoverOpen, setIsContactPopoverOpen] = React.useState(false);
    const [clientAction, setClientAction] = React.useState<string>('select');
    const [isContactFormOpen, setIsContactFormOpen] = React.useState(false);

    // New state for project selection UI
    const [isProjectPopoverOpen, setIsProjectPopoverOpen] = React.useState(false);
    const [projectAction, setProjectAction] = React.useState<string>('select');
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = React.useState(false);
    
    const [eventToEdit, setEventToEdit] = React.useState<TaskEvent | null>(null);
    
    // Integrated Detailed Time Tracking State
    const [timerStatus, setTimerStatus] = React.useState<TimerStatus>('IDLE');
    const [currentSessionSeconds, setCurrentSessionSeconds] = React.useState(0);
    const [sessions, setSessions] = React.useState<TimeSession[]>([]);
    const sessionTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Pre-populate form from URL params
    React.useEffect(() => {
        const loadInitialData = async () => {
            const eventIdParam = searchParams.get('eventId');
            const projectIdParam = searchParams.get('projectId');
            const dateParam = searchParams.get('date');
            const hourParam = searchParams.get('hour');
            const minuteParam = searchParams.get('minute');
            
            let eventData: TaskEvent | null = null;
            if (eventIdParam) {
                try {
                    eventData = await getTaskById(eventIdParam);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not load event data.' });
                }
            }

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
                    setScheduleDate(eventData.start);
                    setScheduleHour(String(eventData.start.getHours()));
                    setScheduleMinute(String(eventData.start.getMinutes()));
                }
            } else {
                setScheduleDate(dateParam ? parseISO(dateParam) : new Date());
                setScheduleHour(hourParam || String(new Date().getHours()));
                setScheduleMinute(minuteParam || String(Math.floor(new Date().getMinutes() / 5) * 5));

                if (projectIdParam) {
                    setSelectedProjectId(projectIdParam);
                }
            }
        };

        loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    useEffect(() => {
        if (timerStatus === 'RUNNING') {
            sessionTimerRef.current = setInterval(() => {
                setCurrentSessionSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (sessionTimerRef.current) {
                clearInterval(sessionTimerRef.current);
                sessionTimerRef.current = null;
            }
        }

        return () => {
            if (sessionTimerRef.current) {
                clearInterval(sessionTimerRef.current);
            }
        };
    }, [timerStatus]);


    const totalAccumulatedSeconds = useMemo(() => {
        return sessions.reduce((acc, session) => acc + session.durationSeconds, 0);
    }, [sessions]);

    const totalTime = useMemo(() => {
        return totalAccumulatedSeconds + currentSessionSeconds;
    }, [totalAccumulatedSeconds, currentSessionSeconds]);

    const handleStartTimer = () => setTimerStatus('RUNNING');
    const handleStopTimer = () => setTimerStatus('PAUSED');

    const handleSaveSession = async () => {
        if (currentSessionSeconds <= 0) {
            toast({ variant: 'destructive', title: "No Time Logged", description: "The current session timer is at zero." });
            return;
        }

        const newSession: TimeSession = {
            id: `session_${Date.now()}`,
            startTime: new Date(Date.now() - currentSessionSeconds * 1000), // Approximate start time
            endTime: new Date(),
            durationSeconds: currentSessionSeconds,
        };
        
        const newSessions = [...sessions, newSession];
        setSessions(newSessions);
        setCurrentSessionSeconds(0);
        setTimerStatus('IDLE');
        toast({ title: "Session Logged", description: `Added a session of ${formatTime(currentSessionSeconds)}.` });
        
        // Auto-save the entire event after logging a session
        await handleSaveEvent(newSessions);
    };


    const handleSaveEvent = async (sessionsToSave?: TimeSession[]) => {
        if (!user || !subject.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter a subject for the event.' });
            return;
        }

        if (scheduleDate === undefined || scheduleHour === undefined || scheduleMinute === undefined) {
            toast({ variant: 'destructive', title: 'Missing Time', description: 'A start date and time are required.' });
            return;
        }
        
        const startDateTime = set(scheduleDate, { hours: parseInt(scheduleHour), minutes: parseInt(scheduleMinute) });
        const endDateTime = addMinutes(startDateTime, 30); // Default 30 minute duration for simple events
        
        const finalSessions = sessionsToSave || sessions;
        const finalTotalTime = finalSessions.reduce((acc, s) => acc + s.durationSeconds, 0) + currentSessionSeconds;
        
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
            duration: finalTotalTime,
            sessions: finalSessions,
            isBillable,
            billableRate: isBillable ? (Number(billableRate) || 0) : 0,
            attendees: ['You'],
        };

        try {
            if (eventToEdit) {
                await updateTask(eventToEdit.id, eventData);
                toast({ title: "Event Updated", description: `"${eventData.title}" has been saved.` });
            } else {
                const newTask = await addTask({ ...eventData as Omit<TaskEvent, 'id'>, userId: user.uid });
                setEventToEdit(newTask); // Set the new event as the one being edited
                toast({ title: "Event Scheduled", description: `"${eventData.title}" has been saved.` });
            }
            window.dispatchEvent(new Event('tasksUpdated'));
            // No longer navigating away automatically
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
        setSelectedContactId(contact.id);
        setClientAction('select');
    };

    const handleProjectCreated = (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: Omit<TaskEvent, 'id'|'userId'|'projectId'>[]) => {
        if (!user) return;
        addProject({ ...projectData, userId: user.uid, createdAt: new Date() })
            .then(newProject => {
                setProjects(prev => [newProject, ...prev]);
                setSelectedProjectId(newProject.id);
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
                        <div className="flex-1 text-center flex items-center justify-center gap-2">
                            <h1 className="text-2xl font-bold font-headline text-primary">Event Manager</h1>
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                            <Link href="/time/instructions">
                                                <Info className="h-5 w-5 text-muted-foreground" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>How to use this manager</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="flex-1 text-right flex items-center justify-end gap-2">
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
                                            <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(true)} className="w-full mt-2">
                                                <Plus className="mr-2 h-4 w-4" /> Create New Project
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes / Details</Label>
                            <Textarea id="notes" placeholder="Add more details about the work..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
                        </div>
                        
                        <div className="space-y-4 p-4 border rounded-md">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Set Time <span className="text-destructive">*</span></Label>
                                <div className="flex gap-2">
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {scheduleDate ? format(scheduleDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <Select value={scheduleHour} onValueChange={setScheduleHour}>
                                        <SelectTrigger><SelectValue placeholder="Hour" /></SelectTrigger>
                                        <SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={scheduleMinute} onValueChange={setScheduleMinute}>
                                        <SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger>
                                        <SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        
                        <Separator />
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is-billable" checked={isBillable} onCheckedChange={(c) => setIsBillable(!!c)} />
                                    <Label htmlFor="is-billable" className="font-medium">Billable</Label>
                                </div>
                                {isBillable && (
                                    <div className="flex items-center gap-2 animate-in fade-in-50 duration-300">
                                        <Label htmlFor="billable-rate">Rate ($/hr)</Label>
                                        <div className="relative w-32">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                                            <Input id="billable-rate" type="number" placeholder="100" value={billableRate} onChange={(e) => setBillableRate(e.target.value === '' ? '' : Number(e.target.value))} className="pl-7" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                         {eventToEdit && (
                            <Card className="bg-muted/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base">Time Log</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <Label className="text-xs">Current Session</Label>
                                                <div className="font-mono text-2xl font-bold">{formatTime(currentSessionSeconds)}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={handleStartTimer} disabled={timerStatus === 'RUNNING'}><Play className="mr-2 h-4 w-4"/> Start</Button>
                                                <Button onClick={handleStopTimer} disabled={timerStatus !== 'RUNNING'} variant="outline"><Pause className="mr-2 h-4 w-4"/> Stop</Button>
                                                <Button onClick={handleSaveSession} disabled={timerStatus === 'IDLE' && currentSessionSeconds === 0} variant="secondary"><Save className="mr-2 h-4 w-4"/> Save Session</Button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Label className="text-xs">Total Logged Time</Label>
                                            <p className="font-mono text-lg font-bold text-primary">{formatTime(totalTime)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Logged Sessions</Label>
                                        <ScrollArea className="h-24 w-full rounded-md border bg-background">
                                           <div className="p-2">{sessions.length > 0 ? (sessions.map((session, index) => (<div key={session.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"><p className="font-medium text-sm">Session {index + 1}</p><div className="flex items-center gap-4"><span className="font-mono text-sm">{formatTime(session.durationSeconds)}</span><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSessions(prev => prev.filter(s => s.id !== session.id))}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></div>))) : (<div className="text-center text-sm text-muted-foreground p-4">No sessions logged yet.</div>)}</div>
                                        </ScrollArea>
                                    </div>
                                </CardContent>
                            </Card>
                         )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-end">
                        <div className="flex items-center gap-2">
                            <Button size="lg" onClick={() => handleSaveEvent()} variant="default">
                                <Save className="mr-2 h-4 w-4" /> {eventToEdit ? 'Save & Close' : 'Save & Close'}
                            </Button>
                        </div>
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

    