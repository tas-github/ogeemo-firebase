
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, Pause, Square, LoaderCircle, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { type Project, type Event as TaskEvent } from '@/types/calendar';
import { type Contact } from '@/data/contacts';
import { addEventEntry, type EventEntry } from '@/services/client-manager-service';
import { addTask } from '@/services/project-service';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { NewTaskDialog } from '../tasks/NewTaskDialog';

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

interface TimeManagerViewProps {
    projects: Project[];
    contacts: Contact[];
}

export function TimeManagerView({ projects, contacts }: TimeManagerViewProps) {
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
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [scheduleInitialData, setScheduleInitialData] = useState({});

    const { user } = useAuth();
    const { toast } = useToast();

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
        if (!subject.trim() || !selectedContactId) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a client and enter a subject to start the timer.',
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
    
    const handleOpenScheduleDialog = () => {
        setScheduleInitialData({
            title: subject,
            description: notes,
            contactId: selectedContactId,
            projectId: selectedProjectId,
        });
        setIsScheduleDialogOpen(true);
    };
    
    const handleTaskCreate = async (taskData: Omit<TaskEvent, 'id' | 'userId'>) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create events.' });
            return;
        }
        try {
            await addTask({ ...taskData, userId: user.uid, position: 0 });
            toast({ title: "Event Scheduled", description: `"${taskData.title}" has been added to your calendar.` });
            handleReset(false);
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Failed to create event', description: error.message });
        }
    };

    return (
        <>
        <div className="p-4 sm:p-6 space-y-6 flex flex-col items-center">
            <header className="relative w-full max-w-4xl">
                <div className="relative flex justify-center items-center">
                    <div className="flex items-center gap-3 absolute left-0">
                        <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold font-headline text-primary">Event Time Manager</h1>
                        <p className="text-muted-foreground">
                            Track your time time against all events and check the box if the event is billable
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
                            <Label htmlFor="client">Client <span className="text-destructive">*</span></Label>
                            <Select value={selectedContactId || ''} onValueChange={handleContactChange} disabled={isActive}>
                                <SelectTrigger id="client"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                                <SelectContent>
                                     {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
                        <Input id="subject" placeholder="What is the main task?" value={subject} onChange={handleSubjectChange} />
                        <p className="text-xs text-muted-foreground">A subject is required to start the timer.</p>
                    </div>
                    
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
                            <Button size="lg" variant="outline" onClick={handleOpenScheduleDialog}>
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
        <NewTaskDialog
            isOpen={isScheduleDialogOpen}
            onOpenChange={setIsScheduleDialogOpen}
            onTaskCreate={handleTaskCreate}
            contacts={contacts}
            defaultValues={scheduleInitialData}
            isProject={false}
        />
        </>
    );
}
