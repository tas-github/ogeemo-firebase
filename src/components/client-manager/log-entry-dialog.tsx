
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

export const TIMER_STORAGE_KEY = 'activeLogEntryTimer';

export interface StoredTimerState {
    startTime: number; // Timestamp when started
    totalPausedDuration: number; // in seconds
    pauseTime: number | null; // Timestamp when paused
    title: string;
    isActive: boolean;
    isPaused: boolean;
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
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const { toast } = useToast();
    
    const resetTimerAndForm = useCallback(() => {
        setIsActive(false);
        setIsPaused(true);
        setElapsedSeconds(0);
        setTitle('');
        setDescription('');
        setSelectedContactId(null);
        setBillableRate(100);
        setIsBillable(true);
        localStorage.removeItem(TIMER_STORAGE_KEY);
        window.dispatchEvent(new Event('storage')); // Notify other components of removal
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
                        setIsActive(savedState.isActive);
                        setIsPaused(savedState.isPaused);
                        setTitle(savedState.title);
                    } else {
                        resetTimerAndForm();
                    }
                } catch (e) {
                    console.error("Error loading timer state:", e);
                    resetTimerAndForm();
                }
            }
        }
    }, [isOpen, eventToEdit, resetTimerAndForm]);
    
    useEffect(() => {
        const calculateElapsed = () => {
            const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
            if (savedStateRaw) {
                const savedState: StoredTimerState = JSON.parse(savedStateRaw);
                if (savedState.isPaused) {
                    const elapsed = Math.floor((savedState.pauseTime! - savedState.startTime) / 1000) - savedState.totalPausedDuration;
                    setElapsedSeconds(elapsed > 0 ? elapsed : 0);
                } else {
                    const elapsed = Math.floor((Date.now() - savedState.startTime) / 1000) - savedState.totalPausedDuration;
                    setElapsedSeconds(elapsed > 0 ? elapsed : 0);
                }
            }
        };

        if (isActive) {
            intervalRef.current = setInterval(calculateElapsed, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isActive]);

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
        
        resetTimerAndForm();

        if (eventToEdit && onTaskUpdate) {
            onTaskUpdate({ id: eventToEdit.id, ...eventData });
        } else if (onTaskCreate) {
            onTaskCreate(eventData);
        }
        onOpenChange(false);
    };

    const handleStart = () => {
        if (!title.trim() || !selectedContactId) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please set a title and select a client before starting.'});
            return;
        }
        const state: StoredTimerState = {
            startTime: Date.now(),
            totalPausedDuration: 0,
            pauseTime: null,
            isActive: true,
            isPaused: false,
            title: title || 'Untitled Timer'
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new Event('storage'));
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
            savedState.pauseTime = null;
            savedState.isPaused = false;
        } else { // Pausing
            savedState.pauseTime = Date.now();
            savedState.isPaused = true;
        }
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(savedState));
        window.dispatchEvent(new Event('storage'));
        setIsPaused(!isPaused);
    };
    
    const handleStop = () => {
        setIsActive(false);
        setIsPaused(true);
        localStorage.removeItem(TIMER_STORAGE_KEY);
        window.dispatchEvent(new Event('storage'));
        toast({ title: 'Timer Stopped', description: `${formatTime(elapsedSeconds)} is ready to be logged.` });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                        <Input id="log-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isActive} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="log-client">Client</Label>
                            <Select value={selectedContactId || ''} onValueChange={setSelectedContactId} disabled={isActive}>
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
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />{eventToEdit ? 'Save Changes' : 'Log Entry'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
