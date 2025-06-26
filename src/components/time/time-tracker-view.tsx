
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Clock, Play, Pause, Square } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { type Contact, mockContacts } from "@/data/contacts";

interface TimeEntry {
  id: string;
  contactId: string;
  contactName: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  billableRate: number;
}

interface StoredTimerState {
  contactId: string;
  description: string;
  billableRate: number;
  isPaused: boolean;
  elapsedTime: number; // elapsed seconds *before* the last active period started
  lastTickTimestamp: number; // when the timer was last running
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function TimeTrackerView() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [billableRate, setBillableRate] = useState<number>(100);
  const [taskDescription, setTaskDescription] = useState("");
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const saveStateToLocalStorage = useCallback((state: StoredTimerState) => {
    localStorage.setItem('activeTimerState', JSON.stringify(state));
  }, []);

  const clearStateFromLocalStorage = useCallback(() => {
    localStorage.removeItem('activeTimerState');
  }, []);

  useEffect(() => {
    const savedStateRaw = localStorage.getItem('activeTimerState');
    if (savedStateRaw) {
      try {
        const state: StoredTimerState = JSON.parse(savedStateRaw);
        setSelectedContactId(state.contactId);
        setTaskDescription(state.description);
        setBillableRate(state.billableRate);
        setIsActive(true);
        setIsPaused(state.isPaused);
        
        let totalElapsed = state.elapsedTime;
        if (!state.isPaused) {
          const now = Date.now();
          const elapsedSinceLastTick = Math.floor((now - state.lastTickTimestamp) / 1000);
          totalElapsed += elapsedSinceLastTick;
        }
        setElapsedTime(totalElapsed);

      } catch (error) {
        console.error("Failed to parse timer state:", error);
        clearStateFromLocalStorage();
      }
    }
  }, [clearStateFromLocalStorage]);
  
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused]);

  const handleStart = () => {
    if (!selectedContactId) {
      toast({ variant: "destructive", title: "Please select a client." });
      return;
    }
    if (!taskDescription.trim()) {
      toast({ variant: "destructive", title: "Please enter a task description." });
      return;
    }
    setIsActive(true);
    setIsPaused(false);
    setElapsedTime(0);

    const state: StoredTimerState = {
        contactId: selectedContactId,
        description: taskDescription,
        billableRate,
        isPaused: false,
        elapsedTime: 0,
        lastTickTimestamp: Date.now()
    };
    saveStateToLocalStorage(state);
  };

  const handlePauseResume = () => {
    const wasPaused = isPaused;
    setIsPaused(!wasPaused);

    const savedStateRaw = localStorage.getItem('activeTimerState');
    if(savedStateRaw) {
        try {
            const state: StoredTimerState = JSON.parse(savedStateRaw);
            state.isPaused = !wasPaused;
            if (wasPaused) { // Resuming
                state.lastTickTimestamp = Date.now();
            } else { // Pausing
                state.elapsedTime = elapsedTime;
            }
            saveStateToLocalStorage(state);
        } catch(e) { console.error(e) }
    }
  };

  const handleStop = () => {
    if (!selectedContactId) return;

    const contact = mockContacts.find(c => c.id === selectedContactId);
    if (!contact) return;

    const newEntry: TimeEntry = {
      id: `entry-${Date.now()}`,
      contactId,
      contactName: contact.name,
      description: taskDescription,
      startTime: new Date(Date.now() - elapsedTime * 1000), // Approximate start time
      endTime: new Date(),
      duration: elapsedTime,
      billableRate,
    };

    setTimeEntries(prev => [newEntry, ...prev]);
    
    // Reset state
    setIsActive(false);
    setIsPaused(false);
    setElapsedTime(0);
    setTaskDescription("");
    setSelectedContactId(null);
    clearStateFromLocalStorage();

    toast({ title: "Task Time Logged", description: `Logged ${formatTime(elapsedTime)} for ${contact.name}.` });
  };
  
  const selectedContact = mockContacts.find(c => c.id === selectedContactId);
  const totalBillable = timeEntries.reduce((acc, entry) => {
    const hours = entry.duration / 3600;
    return acc + (hours * entry.billableRate);
  }, 0).toFixed(2);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">Client Manager</h1>
        <p className="text-muted-foreground">Select a client to manage their tasks and track time.</p>
      </header>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Client Task Timer</CardTitle>
          <CardDescription>All fields are required to start the timer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="client-select">Client</Label>
              <Select value={selectedContactId ?? ''} onValueChange={setSelectedContactId} disabled={isActive}>
                <SelectTrigger id="client-select">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {mockContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="billable-rate">Billable Rate ($/hr)</Label>
              <Input
                id="billable-rate"
                type="number"
                value={billableRate}
                onChange={(e) => setBillableRate(Number(e.target.value))}
                disabled={isActive}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Task Description</Label>
            <Input
              id="task-description"
              placeholder="e.g., Drafting initial project proposal"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              disabled={isActive}
            />
          </div>

          <Card className="bg-muted/50 text-center p-6">
            <div className="text-6xl font-mono font-bold text-primary tracking-tighter">
              {formatTime(elapsedTime)}
            </div>
            {isActive && selectedContact && (
              <p className="text-muted-foreground mt-2">
                Timer is running for <span className="font-semibold text-primary">{selectedContact.name}</span>
              </p>
            )}
          </Card>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {!isActive ? (
            <Button size="lg" onClick={handleStart} className="w-48">
              <Play className="mr-2 h-5 w-5" /> Start Timer
            </Button>
          ) : (
            <>
              <Button size="lg" variant="outline" onClick={handlePauseResume} className="w-48">
                {isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button size="lg" variant="destructive" onClick={handleStop} className="w-48">
                <Square className="mr-2 h-5 w-5" /> Stop & Log
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Logged Task Entries</CardTitle>
                    <CardDescription>A record of all your tracked time for clients.</CardDescription>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Billable</p>
                    <p className="text-2xl font-bold text-primary">${totalBillable}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Duration</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timeEntries.length > 0 ? timeEntries.map(entry => (
                             <TableRow key={entry.id}>
                                <TableCell className="font-medium">{entry.contactName}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell className="text-right font-mono">{formatTime(entry.duration)}</TableCell>
                                <TableCell className="text-right font-mono">${((entry.duration / 3600) * entry.billableRate).toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No time entries logged yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
