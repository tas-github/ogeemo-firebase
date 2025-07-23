
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { type Event } from '@/types/calendar';
import { type Contact } from '@/services/contact-service';
import { Play, Pause, Square, Save } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface LogEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreate?: (taskData: Omit<Event, 'id' | 'userId'>) => void;
  onTaskUpdate?: (taskData: Omit<Event, 'userId'>) => void;
  eventToEdit?: Event | null;
  contacts: Contact[];
}

const TIMER_STORAGE_KEY = 'logEntryTimerState';

interface StoredTimerState {
    startTime: number;
    totalPausedDuration: number;
    pauseTime: number | null;
}

export function LogEntryDialog({ isOpen, onOpenChange, onTaskCreate, onTaskUpdate, eventToEdit, contacts }: LogEntryDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [billableRate, setBillableRate] = useState(0);
    const [isBillable, setIsBillable] = useState(true);
    
    // Timer state
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [keepRunning, setKeepRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const { toast } = useToast();
    
    const resetTimerState = useCallback(() => {
        setIsActive(false);
        setIsPaused(true);
        setElapsedSeconds(0);
        setKeepRunning(false);
        localStorage.removeItem(TIMER_STORAGE_KEY);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                setTitle(eventToEdit.title);
                setDescription(eventToEdit.description || '');
                setSelectedContactId(eventToEdit.contactId || null);
                setBillableRate(eventToEdit.billableRate || 0);
                setIsBillable((eventToEdit.billableRate || 0) > 0);
                setElapsedSeconds(eventToEdit.duration || 0);
                setIsActive(false);
                setIsPaused(true);
            } else {
                // Check for a running timer in localStorage
                try {
                    const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
                    if (savedStateRaw) {
                        const savedState: StoredTimerState = JSON.parse(savedStateRaw);
                        setIsActive(true);
                        setIsPaused(savedState.isPaused);
                        setKeepRunning(true); // Assume if it was saved, user wants it to keep running
                        
                        let currentElapsed = 0;
                        if (savedState.isPaused) {
                            currentElapsed = Math.floor((savedState.pauseTime! - savedState.startTime) / 1000) - savedState.totalPausedDuration;
                        } else {
                            currentElapsed = Math.floor((Date.now() - savedState.startTime) / 1000) - savedState.totalPausedDuration;
                        }
                        setElapsedSeconds(currentElapsed > 0 ? currentElapsed : 0);
                    } else {
                        setTitle('');
                        setDescription('');
                        setSelectedContactId(null);
                        setBillableRate(100);
                        setIsBillable(true);
                        resetTimerState();
                    }
                } catch (e) {
                    console.error("Error loading timer state:", e);
                    resetTimerState();
                }
            }
        }
    }, [isOpen, eventToEdit, resetTimerState]);

    useEffect(() => {
        if (isActive && !isPaused) {
            intervalRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isActive, isPaused]);

    const handleSave = () => {
        if (!selectedContactId) {
            toast({ variant: 'destructive', title: 'Client Required', description: 'Please select a client.' });
            return;
        }

        const now = new Date();
        const start = eventToEdit?.start || new Date(now.getTime() - elapsedSeconds * 1000);
        const end = eventToEdit?.end || now;

        const eventData = {
            title: title || 'Time Entry',
            description,
            start,
            end,
            duration: elapsedSeconds,
            contactId: selectedContactId,
            billableRate: isBillable ? billableRate : 0,
            status: eventToEdit?.status || 'todo',
            position: eventToEdit?.position || 0,
            projectId: eventToEdit?.projectId,
        };
        
        resetTimerState();

        if (eventToEdit && onTaskUpdate) {
            onTaskUpdate({ id: eventToEdit.id, ...eventData });
        } else if (onTaskCreate) {
            onTaskCreate(eventData);
        }
        onOpenChange(false);
    };

    const handleStart = () => {
        const state: StoredTimerState = {
            startTime: Date.now(),
            totalPausedDuration: 0,
            pauseTime: null,
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
        setIsActive(true);
        setIsPaused(false);
        setElapsedSeconds(0);
    };
    
    const handlePauseResume = () => {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (!savedStateRaw) return;
        const savedState: StoredTimerState = JSON.parse(savedStateRaw);

        if (isPaused) { // Resuming
            if (savedState.pauseTime) {
                const pausedDuration = Math.floor((Date.now() - savedState.pauseTime) / 1000);
                savedState.totalPausedDuration += pausedDuration;
            }
            savedState.isPaused = false;
            savedState.pauseTime = null;
        } else { // Pausing
            savedState.isPaused = true;
            savedState.pauseTime = Date.now();
        }
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(savedState));
        setIsPaused(!isPaused);
    };
    
    const handleStop = () => {
        setIsActive(false);
        setIsPaused(true);
        toast({ title: 'Timer Stopped', description: `${formatTime(elapsedSeconds)} is ready to be logged.` });
    }

    const handleOpenChangeWrapper = (open: boolean) => {
        if (!open) { // Closing
            if (!keepRunning && isActive) {
                resetTimerState();
            } else if (keepRunning && isActive) {
                 const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
                 if (!savedStateRaw) return;
                 const savedState: StoredTimerState = JSON.parse(savedStateRaw);

                 const timeSinceStart = Math.floor((Date.now() - savedState.startTime) / 1000);
                 const effectiveElapsed = timeSinceStart - savedState.totalPausedDuration;
                 setElapsedSeconds(effectiveElapsed);
            }
        }
        onOpenChange(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChangeWrapper}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{eventToEdit ? 'Edit Log Entry' : 'New Log Entry'}</DialogTitle>
                    <DialogDescription>
                        {eventToEdit ? 'Update the details for this entry.' : 'Log a new time entry for a client.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="log-title">Title / Subject</Label>
                        <Input id="log-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="log-client">Client</Label>
                            <Select value={selectedContactId || ''} onValueChange={setSelectedContactId}>
                                <SelectTrigger id="log-client"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                                <SelectContent>
                                    {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {isBillable && (
                            <div className="space-y-2 animate-in fade-in-50 duration-300">
                                <Label htmlFor="log-rate">Billable Rate ($/hr)</Label>
                                <Input id="log-rate" type="number" value={billableRate} onChange={(e) => setBillableRate(Number(e.target.value))} />
                            </div>
                        )}
                     </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="is-billable" checked={isBillable} onCheckedChange={(checked) => setIsBillable(!!checked)} />
                        <Label htmlFor="is-billable" className="font-normal">This is a billable event</Label>
                     </div>
                    <div className="space-y-2">
                        <Label htmlFor="log-description">Description / Notes</Label>
                        <Textarea id="log-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2 text-center">
                        <Label>Time Tracker</Label>
                        <div className="p-4 bg-muted rounded-lg">
                             <p className="text-4xl font-mono font-bold text-primary tracking-tight">
                                {formatTime(elapsedSeconds)}
                             </p>
                        </div>
                        <div className="flex justify-center gap-2 pt-2">
                            {!isActive ? (
                                <Button onClick={handleStart} variant="outline" className="w-32"><Play className="mr-2 h-4 w-4" /> Start</Button>
                            ) : (
                                <>
                                <Button onClick={handlePauseResume} variant="outline" className="w-32">
                                    {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button onClick={handleStop} variant="secondary" className="w-32">
                                    <Square className="mr-2 h-4 w-4" /> Stop
                                </Button>
                                </>
                            )}
                        </div>
                    </div>
                     <div className="flex items-center space-x-2 pt-4">
                        <Checkbox id="keep-running" checked={keepRunning} onCheckedChange={(checked) => setKeepRunning(!!checked)} />
                        <Label htmlFor="keep-running" className="text-xs font-normal">Keep timer running in background</Label>
                     </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />{eventToEdit ? 'Save Changes' : 'Log Entry'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
