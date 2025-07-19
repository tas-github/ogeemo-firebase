
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Play, Pause, Square, LoaderCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { getProjects, type Project } from '@/services/project-service';
import { getClientAccounts, type ClientAccount } from '@/services/client-manager-service';
import { addEventEntry, type EventEntry } from '@/services/client-manager-service';
import { format, formatDistanceToNow } from 'date-fns';

const TIMER_STORAGE_KEY = 'activeTimeManagerEntry';

interface StoredTimerState {
    startTime: number;
    isActive: boolean;
    isPaused: boolean;
    pauseTime: number | null;
    totalPausedDuration: number;
    projectId: string | null;
    clientId: string | null;
    notes: string;
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
    
    const [notes, setNotes] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<ClientAccount[]>([]);
    const [recentEntries, setRecentEntries] = useState<EventEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user } = useAuth();
    const { toast } = useToast();

    const saveState = useCallback(() => {
        if (!isActive) {
            localStorage.removeItem(TIMER_STORAGE_KEY);
            return;
        }
        const stateToStore: StoredTimerState = {
            startTime: JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY) || '{}').startTime || Date.now(),
            isActive,
            isPaused,
            pauseTime: isPaused ? Date.now() : null,
            totalPausedDuration: JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY) || '{}').totalPausedDuration || 0,
            projectId: selectedProjectId,
            clientId: selectedClientId,
            notes,
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(stateToStore));
    }, [isActive, isPaused, selectedProjectId, selectedClientId, notes]);


    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
                if (savedStateRaw) {
                    const savedState: StoredTimerState = JSON.parse(savedStateRaw);
                    if (savedState.isActive && !savedState.isPaused) {
                        const now = Date.now();
                        const elapsed = Math.floor((now - savedState.startTime) / 1000) - savedState.totalPausedDuration;
                        setElapsedSeconds(elapsed > 0 ? elapsed : 0);
                        
                        // Also sync form state if it's running
                        setIsActive(true);
                        setIsPaused(false);
                        setNotes(savedState.notes);
                        setSelectedProjectId(savedState.projectId);
                        setSelectedClientId(savedState.clientId);
                    }
                }
            } catch (e) { console.error("Error reading timer state", e); }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function loadData() {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [projectsData, clientsData] = await Promise.all([
                    getProjects(user.uid),
                    getClientAccounts(user.uid),
                ]);
                setProjects(projectsData);
                setClients(clientsData);
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
            clientId: selectedClientId,
            notes,
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
        setIsActive(true);
        setIsPaused(false);
        setElapsedSeconds(0);
    };

    const handlePauseTimer = () => {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (!savedStateRaw) return;
        const savedState: StoredTimerState = JSON.parse(savedStateRaw);

        savedState.isPaused = true;
        savedState.pauseTime = Date.now();
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(savedState));
        setIsPaused(true);
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
        setIsPaused(false);
    };

    const handleLogTime = async () => {
        if (!user || elapsedSeconds <= 0) return;
        
        const client = clients.find(c => c.id === selectedClientId);
        if (!client) {
            toast({ variant: 'destructive', title: 'Client Required', description: 'Please select a client to log time.' });
            return;
        }

        const newEntry: Omit<EventEntry, 'id'> = {
            accountId: client.id,
            contactName: client.name,
            subject: notes || 'Time Entry',
            startTime: new Date(Date.now() - elapsedSeconds * 1000),
            endTime: new Date(),
            duration: elapsedSeconds,
            billableRate: 0, // Default rate
            userId: user.uid,
        };
        
        try {
            const addedEntry = await addEventEntry(newEntry);
            setRecentEntries(prev => [addedEntry, ...prev].slice(0, 5));
            toast({ title: 'Time Logged', description: `Logged ${formatTime(elapsedSeconds)} for ${client.name}` });

            // Reset timer
            setIsActive(false);
            setIsPaused(false);
            setElapsedSeconds(0);
            setNotes("");
            setSelectedClientId(null);
            setSelectedProjectId(null);
            localStorage.removeItem(TIMER_STORAGE_KEY);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Log Failed', description: error.message });
        }
    };
    
    const selectedProjectName = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId)?.name || 'N/A';
    }, [projects, selectedProjectId]);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="text-center">
                <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
                    <Clock className="h-8 w-8" />
                    Time Manager
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
                    Track your time against projects and clients to ensure accurate billing.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Live Timer</CardTitle>
                        <CardDescription>Start the timer to begin tracking your work.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center p-8 bg-muted rounded-lg">
                            <p className="text-7xl font-mono font-bold text-primary tracking-tighter">
                                {formatTime(elapsedSeconds)}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="project">Project</Label>
                                <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId} disabled={isActive}>
                                    <SelectTrigger id="project"><SelectValue placeholder="Select a project..." /></SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="client">Client</Label>
                                <Select value={selectedClientId || ''} onValueChange={setSelectedClientId} disabled={isActive}>
                                    <SelectTrigger id="client"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                                    <SelectContent>
                                         {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes / Task Description</Label>
                            <Input id="notes" placeholder="What are you working on?" value={notes} onChange={e => setNotes(e.target.value)} disabled={isActive} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex gap-2">
                            {!isActive ? (
                                <Button size="lg" onClick={handleStartTimer}>
                                    <Play className="mr-2 h-5 w-5" /> Start Timer
                                </Button>
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
                        <p className="text-sm text-muted-foreground">Entries are saved to the Client Manager.</p>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Entries</CardTitle>
                        <CardDescription>Your last 5 time entries.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                             <div className="flex justify-center items-center h-48"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
                        ) : recentEntries.length > 0 ? (
                            <div className="space-y-4">
                            {recentEntries.map(entry => (
                                <div key={entry.id} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-semibold">{entry.subject}</p>
                                        <p className="text-xs text-muted-foreground">{entry.contactName} - {formatDistanceToNow(entry.startTime, { addSuffix: true })}</p>
                                    </div>
                                    <p className="font-mono">{formatTime(entry.duration)}</p>
                                </div>
                            ))}
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-10">No recent time entries found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
