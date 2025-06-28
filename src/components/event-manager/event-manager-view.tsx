
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { type Contact, mockContacts } from "@/data/contacts";
import { TimerDialog } from './timer-dialog';

interface EventEntry {
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

export function EventManagerView() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [billableRate, setBillableRate] = useState<number>(100);
  const [subject, setSubject] = useState("");
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [eventEntries, setEventEntries] = useState<EventEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [isTimerOpen, setIsTimerOpen] = useState(false);

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
        setSubject(state.description);
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

    const savedEntriesRaw = localStorage.getItem('eventEntries');
    if (savedEntriesRaw) {
        try {
            const savedEntries = JSON.parse(savedEntriesRaw).map((entry: any) => ({
                ...entry,
                startTime: new Date(entry.startTime),
                endTime: new Date(entry.endTime),
            }));
            setEventEntries(savedEntries);
        } catch (error) {
            console.error("Failed to parse event entries:", error);
            localStorage.removeItem('eventEntries');
        }
    }
    setIsLoaded(true);
  }, [clearStateFromLocalStorage]);

  useEffect(() => {
    if (isLoaded) {
        localStorage.setItem('eventEntries', JSON.stringify(eventEntries));
    }
  }, [eventEntries, isLoaded]);
  
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
    if (!subject.trim()) {
      toast({ variant: "destructive", title: "Please enter a subject." });
      return;
    }
    setIsActive(true);
    setIsPaused(false);
    setElapsedTime(0);

    const state: StoredTimerState = {
        contactId: selectedContactId,
        description: subject,
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
              if (wasPaused) { 
                  state.lastTickTimestamp = Date.now();
              } else { 
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

    const newEntry: EventEntry = {
      id: `entry-${Date.now()}`,
      contactId,
      contactName: contact.name,
      description: subject,
      startTime: new Date(Date.now() - elapsedTime * 1000),
      endTime: new Date(),
      duration: elapsedTime,
      billableRate,
    };

    setEventEntries(prev => [newEntry, ...prev]);
    
    setIsActive(false);
    setIsPaused(false);
    setElapsedTime(0);
    setSubject("");
    setSelectedContactId(null);
    clearStateFromLocalStorage();

    toast({ title: "Event Logged", description: `Logged ${formatTime(elapsedTime)} for ${contact.name}.` });
  };
  
  const selectedContact = mockContacts.find(c => c.id === selectedContactId);
  const totalBillable = eventEntries.reduce((acc, entry) => {
    const hours = entry.duration / 3600;
    return acc + (hours * entry.billableRate);
  }, 0).toFixed(2);

  const currentBillableAmount = isActive ? (elapsedTime / 3600) * billableRate : 0;

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold font-headline text-primary">Event Manager</h1>
          <p className="text-muted-foreground">Select a client to manage their events and track time.</p>
        </header>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Event Logger</CardTitle>
                <CardDescription>All fields are required to start the timer.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 {isActive && (
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-mono text-muted-foreground p-2 rounded-md border bg-muted">
                        {formatTime(elapsedTime)}
                      </div>
                       <div className="text-sm font-mono font-semibold text-primary">
                        ${currentBillableAmount.toFixed(2)}
                      </div>
                    </div>
                )}
                <Button onClick={() => setIsTimerOpen(true)}>
                  <Clock className="mr-2 h-4 w-4" />
                  {isActive ? "Manage Timer" : "Open Timer"}
                </Button>
              </div>
            </div>
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
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter a subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isActive}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
              <div className="flex justify-between items-center">
                  <div>
                      <CardTitle>Logged Events</CardTitle>
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
                              <TableHead>Subject</TableHead>
                              <TableHead className="text-right">Duration</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {eventEntries.length > 0 ? eventEntries.map(entry => (
                               <TableRow key={entry.id}>
                                  <TableCell className="font-medium">{entry.contactName}</TableCell>
                                  <TableCell>{entry.description}</TableCell>
                                  <TableCell className="text-right font-mono">{formatTime(entry.duration)}</TableCell>
                                  <TableCell className="text-right font-mono">${((entry.duration / 3600) * entry.billableRate).toFixed(2)}</TableCell>
                              </TableRow>
                          )) : (
                              <TableRow>
                                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No events logged yet.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
          </CardContent>
        </Card>
      </div>

      <TimerDialog
        isOpen={isTimerOpen}
        onOpenChange={setIsTimerOpen}
        elapsedTime={elapsedTime}
        isActive={isActive}
        isPaused={isPaused}
        selectedContactName={selectedContact?.name}
        handleStart={handleStart}
        handlePauseResume={handlePauseResume}
        handleStop={() => {
            handleStop();
            setIsTimerOpen(false);
        }}
      />
    </>
  );
}
