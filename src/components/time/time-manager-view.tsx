
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, Pause, Square, LoaderCircle, Save, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { type Project, type Event as TaskEvent } from '@/types/calendar-types';
import { type Contact } from '@/data/contacts';
import { addTask, getProjects } from '@/services/project-service';
import { getContacts } from '@/services/contact-service';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format, set, addMinutes, parseISO } from 'date-fns';


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
    const [projects, setProjects] = useState<Project[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    // Form state for both live and scheduled events
    const [subject, setSubject] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [isBillable, setIsBillable] = useState(true);
    const [billableRate, setBillableRate] = useState<number | ''>(100);
    
    // State for scheduling
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
    const [scheduleHour, setScheduleHour] = useState<string>(String(new Date().getHours()));
    const [scheduleMinute, setScheduleMinute] = useState<string>("0");
    const [durationHours, setDurationHours] = useState<number|''> (1);
    const [durationMinutes, setDurationMinutes] = useState<number|''> (0);

    const { user } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Pre-populate form from URL params (e.g., from calendar)
    useEffect(() => {
        const dateParam = searchParams.get('date');
        const hourParam = searchParams.get('hour');
        const minuteParam = searchParams.get('minute');
        if (dateParam) setScheduleDate(parseISO(dateParam));
        if (hourParam) setScheduleHour(hourParam);
        if (minuteParam) setScheduleMinute(minuteParam);
    }, [searchParams]);

    useEffect(() => {
        async function loadData() {
            if (!user) {
                setIsLoadingData(false);
                return;
            }
            setIsLoadingData(true);
            try {
                const [fetchedProjects, fetchedContacts] = await Promise.all([
                    getProjects(user.uid),
                    getContacts(user.uid),
                ]);
                setProjects(fetchedProjects);
                setContacts(fetchedContacts);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
            } finally {
                setIsLoadingData(false);
            }
        }
        loadData();
    }, [user, toast]);

    const updateTimerState = useCallback(() => {
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

    useEffect(() => {
        updateTimerState(); // Initial check
        window.addEventListener('storage', updateTimerState); // Listen for changes from other tabs
        const interval = setInterval(updateTimerState, 1000); // Poll for time updates

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
        window.dispatchEvent(new Event('storage')); // Notify other components
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
            const pausedDuration = Math.floor((Date.now() - savedState.pauseTime) / 1000);
            savedState.totalPausedDuration += pausedDuration;
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
        setSelectedProjectId(null);
        setIsBillable(true);
        setBillableRate(100);
        localStorage.removeItem(TIMER_STORAGE_KEY);
        window.dispatchEvent(new Event('storage'));
        if (showToast) {
            toast({ title: 'Timer Reset', description: 'The timer and fields have been cleared.' });
        }
    }

    const handleLogTime = async () => {
        if (!user || elapsedSeconds <= 0) return;
        
        const contact = contacts.find(c => c.id === selectedContactId);
        
        const finalBillableRate = isBillable ? (Number(billableRate) || 0) : 0;

        const newTaskData: Omit<TaskEvent, 'id' | 'userId'> = {
            title: subject || 'Logged Time Entry',
            description: notes,
            start: new Date(Date.now() - elapsedSeconds * 1000),
            end: new Date(),
            status: 'done',
            position: 0, // Default position
            projectId: selectedProjectId,
            contactId: selectedContactId,
            isScheduled: true, // This was a live-timed event, not pre-scheduled
            duration: elapsedSeconds,
            isBillable,
            billableRate: finalBillableRate,
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
        
        const startDateTime = scheduleDate
            ? set(scheduleDate, { hours: parseInt(scheduleHour), minutes: parseInt(scheduleMinute) })
            : new Date();
        
        const durationInMinutes = (Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);
        const endDateTime = addMinutes(startDateTime, durationInMinutes);
        
        const duration = (endDateTime.getTime() - startDateTime.getTime()) / 1000; // in seconds
        
        const eventData: Omit<TaskEvent, 'id' | 'userId'> = {
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
            await addTask({ ...eventData, userId: user.uid });
            toast({ title: "Event Scheduled", description: `"${eventData.title}" has been saved.` });
            handleReset(false);
            window.dispatchEvent(new Event('tasksUpdated'));
            router.push('/calendar');
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Failed to create event', description: error.message });
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


    if (isLoadingData) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 flex flex-col items-center">
            <header className="relative w-full max-w-4xl">
                <div className="relative flex justify-center items-center">
                    <div className="flex items-center gap-3 absolute left-0">
                        <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold font-headline text-primary">Event Task Manager</h1>
                        <p className="text-muted-foreground">
                            Track your time or schedule future events.
                        </p>
                    </div>
                    <div className="text-right absolute right-0">
                        <p className="text-muted-foreground text-sm">Time Logged</p>
                        <p className="text-2xl font-mono font-bold text-primary tracking-tighter">
                            {formatTime(elapsedSeconds)}
                        </p>
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
                        <div className="space-y-2">
                            <Label htmlFor="project">Project</Label>
                            <Select value={selectedProjectId || ''} onValueChange={handleProjectChange} disabled={isActive}>
                                <SelectTrigger id="project"><SelectValue placeholder="Select a project..." /></SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client">Client</Label>
                            <Select value={selectedContactId || ''} onValueChange={handleContactChange} disabled={isActive}>
                                <SelectTrigger id="client"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                                <SelectContent>
                                     {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes / Details</Label>
                        <Textarea id="notes" placeholder="Add more details about the work..." value={notes} onChange={handleNotesChange} rows={4} />
                    </div>
                    
                    <div className="space-y-4 p-4 border rounded-md">
                         <Label>Schedule for Later (Optional)</Label>
                         <div className="flex items-center gap-2">
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {scheduleDate ? format(scheduleDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                         <div className="flex gap-2">
                            <Select value={scheduleHour} onValueChange={setScheduleHour}><SelectTrigger><SelectValue placeholder="Hour"/></SelectTrigger><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                            <Select value={scheduleMinute} onValueChange={setScheduleMinute}><SelectTrigger><SelectValue placeholder="Min"/></SelectTrigger><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Duration</Label>
                            <div className="flex items-center gap-2">
                                <Input type="number" placeholder="Hours" value={durationHours} onChange={e => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))} />
                                <Input type="number" placeholder="Minutes" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))} step="5" />
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
                                <Save className="mr-2 h-5 w-5" /> Save Event
                            </Button>
                            </>
                        ) : (
                            <>
                             <Button size="lg" variant="outline" onClick={isPaused ? handleResumeTimer : handlePauseTimer}>
                                 {isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
                                 {isPaused ? 'Resume' : 'Pause'}
                             </Button>
                             <Button size="lg" variant="destructive" onClick={handleLogTime}>
                                 <Square className="mr-2 h-5 w-5" /> Stop & Log Time
                             </Button>
                            </>
                        )}
                    </div>
                    <Button variant="ghost" onClick={() => handleReset()}>Reset</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
