
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, Pause, Square, LoaderCircle, Save, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { getProjects, type Project } from '@/services/project-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { addEventEntry, type EventEntry } from '@/services/client-manager-service';
import { addTask, type Event as TaskEvent } from '@/services/project-service';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { format, set, differenceInSeconds, addMinutes } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';

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
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [startHour, setStartHour] = useState<string>(String(new Date().getHours()));
    const [startMinute, setStartMinute] = useState<string>("0");
    const [durationHours, setDurationHours] = useState<number | ''>(1);
    const [durationMinutes, setDurationMinutes] = useState<number | ''>(0);

    const [projects, setProjects] = useState<Project[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user } = useAuth();
    const { toast } = useToast();

    // ... (updateTimerState and useEffect for polling remain the same)
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


    useEffect(() => {
        async function loadData() {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [projectsData, contactsData] = await Promise.all([
                    getProjects(user.uid),
                    getContacts(user.uid),
                ]);
                setProjects(projectsData);
                setContacts(contactsData);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user, toast]);

    const handleStartTimer = () => {
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

    // ... (handlePauseTimer and handleResumeTimer remain the same)
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
        if (!contact) {
            toast({ variant: 'destructive', title: 'Client Required', description: 'Please select a client to log time.' });
            return;
        }
        
        const project = projects.find(p => p.id === selectedProjectId);
        if (!project) {
            toast({ variant: 'destructive', title: 'Project Required', description: 'Please select a project to log time against.' });
            return;
        }

        const finalBillableRate = isBillable ? (Number(billableRate) || 0) : 0;

        const newEntry: Omit<EventEntry, 'id'> = {
            accountId: contact.id,
            contactName: contact.name,
            subject: subject || 'Time Entry',
            detailsHtml: notes.replace(/\n/g, '<br>'),
            startTime: new Date(Date.now() - elapsedSeconds * 1000),
            endTime: new Date(),
            duration: elapsedSeconds,
            billableRate: finalBillableRate,
            userId: user.uid,
        };
        
        try {
            await addEventEntry(newEntry);
            toast({ title: 'Time Logged', description: `Logged ${formatTime(elapsedSeconds)} for ${contact.name}` });
            handleReset(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Log Failed', description: error.message });
        }
    };
    
    // ... (updateStoredState and form field handlers remain similar)
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

    const handleSaveEvent = async () => {
        if (!user) return;

        const totalDuration = (Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);
        if (totalDuration <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Duration', description: 'Please set a duration for the event.' });
            return;
        }

        const startDateTime = set(startDate!, {
            hours: parseInt(startHour),
            minutes: parseInt(startMinute)
        });

        const endDateTime = addMinutes(startDateTime, totalDuration);

        const newEventData: Omit<TaskEvent, 'id' | 'userId'> = {
            title: subject || 'Untitled Event',
            description: notes,
            start: startDateTime,
            end: endDateTime,
            status: 'todo',
            position: 0,
            projectId: selectedProjectId,
            contactId: selectedContactId,
            billableRate: isBillable ? Number(billableRate) : 0,
        };
        
        try {
            await addTask({ ...newEventData, userId: user.uid });
            toast({ title: "Event Saved", description: `"${newEventData.title}" has been added to your calendar.` });
            handleReset(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to save event', description: error.message });
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


    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 flex flex-col items-center">
            <header className="text-center w-full max-w-4xl">
                <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
                    <Clock className="h-8 w-8" />
                    Event Time Manager
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
                    Track your time time against all events and check the box if the event is billable
                </p>
            </header>

            <Card className="w-full max-w-4xl">
                <CardHeader className="text-center">
                    <p className="text-6xl font-mono font-bold text-primary tracking-tighter">
                        {formatTime(elapsedSeconds)}
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" placeholder="What is the main task?" value={subject} onChange={handleSubjectChange} />
                    </div>
                    
                    {!isActive && (
                         <div className="space-y-4 pt-4 border-t animate-in fade-in-50 duration-300">
                            <h3 className="text-sm font-medium text-muted-foreground">Scheduling</h3>
                            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Hour</Label>
                                    <Select value={startHour} onValueChange={setStartHour}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Minute</Label>
                                    <Select value={startMinute} onValueChange={setStartMinute}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                             <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
                                <div className="space-y-2 self-end">
                                    <Label>Duration</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration-hours" className="text-xs text-muted-foreground">Hours</Label>
                                    <Input id="duration-hours" type="number" min="0" value={durationHours} onChange={(e) => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                                    <Input id="duration-minutes" type="number" min="0" max="59" step="5" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))} />
                                </div>
                            </div>
                         </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes / Details</Label>
                        <Textarea id="notes" placeholder="Add more details about the work..." value={notes} onChange={handleNotesChange} rows={8} />
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
                            <Button size="lg" variant="outline" onClick={handleSaveEvent}>
                                <Save className="mr-2 h-5 w-5" /> Save Event to Calendar
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
