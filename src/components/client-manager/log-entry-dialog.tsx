
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { format, set, parseISO, differenceInSeconds } from 'date-fns';
import { Play, Pause, Square, Save } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

interface LogEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreate?: (taskData: Omit<Event, 'id' | 'userId'>) => void;
  onTaskUpdate?: (taskData: Omit<Event, 'userId'>) => void;
  eventToEdit?: Event | null;
  contacts: Contact[];
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
                setTitle('');
                setDescription('');
                setSelectedContactId(null);
                setBillableRate(100); // Default rate
                setIsBillable(true);
                setElapsedSeconds(0);
                setIsActive(false);
                setIsPaused(true);
            }
        }
    }, [isOpen, eventToEdit]);

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

        if (eventToEdit && onTaskUpdate) {
            onTaskUpdate({ id: eventToEdit.id, ...eventData });
        } else if (onTaskCreate) {
            onTaskCreate(eventData);
        }
        onOpenChange(false);
    };

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
                                <Button onClick={() => { setIsActive(true); setIsPaused(false); }} variant="outline" className="w-32"><Play className="mr-2 h-4 w-4" /> Start</Button>
                            ) : (
                                <>
                                <Button onClick={() => setIsPaused(!isPaused)} variant="outline" className="w-32">
                                    {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button onClick={() => { setIsActive(false); setIsPaused(true); }} variant="secondary" className="w-32">
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
