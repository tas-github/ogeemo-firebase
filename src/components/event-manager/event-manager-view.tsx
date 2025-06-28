
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Clock, BookOpen, Bold, Italic, Underline, List, ListOrdered, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { type Contact, mockContacts } from "@/data/contacts";
import { TimerDialog } from './timer-dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { EventDetailsDialog } from './event-details-dialog';


interface EventEntry {
  id: string;
  contactId: string;
  contactName: string;
  subject: string;
  detailsHtml?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  billableRate: number;
}

interface StoredTimerState {
  contactId: string;
  subject: string;
  detailsHtml?: string;
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
  const [detailsHtml, setDetailsHtml] = useState("");
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  const [allEventEntries, setAllEventEntries] = useState<EventEntry[]>([]);
  const [clientEventEntries, setClientEventEntries] = useState<EventEntry[]>([]);
  const [selectedLogEntry, setSelectedLogEntry] = useState<EventEntry | null>(null);


  const saveStateToLocalStorage = useCallback((state: StoredTimerState) => {
    localStorage.setItem('activeTimerState', JSON.stringify(state));
  }, []);

  const clearStateFromLocalStorage = useCallback(() => {
    localStorage.removeItem('activeTimerState');
  }, []);

  // Load all entries from local storage on mount
  const loadAllEntries = useCallback(() => {
    const savedEntriesRaw = localStorage.getItem('eventEntries');
    if (savedEntriesRaw) {
      try {
        const savedEntries = JSON.parse(savedEntriesRaw).map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: new Date(entry.endTime),
        }));
        setAllEventEntries(savedEntries);
      } catch (error) {
        console.error("Failed to parse event entries:", error);
      }
    }
  }, []);

  useEffect(() => {
    const savedStateRaw = localStorage.getItem('activeTimerState');
    if (savedStateRaw) {
      try {
        const state: StoredTimerState = JSON.parse(savedStateRaw);
        setSelectedContactId(state.contactId);
        setSubject(state.subject);
        setDetailsHtml(state.detailsHtml || "");
        if (editorRef.current) {
            editorRef.current.innerHTML = state.detailsHtml || "";
        }
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
    loadAllEntries();
  }, [clearStateFromLocalStorage, loadAllEntries]);
  
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
  
  // Filter events for the selected client
  useEffect(() => {
    if (selectedContactId) {
      const filteredEntries = allEventEntries.filter(entry => entry.contactId === selectedContactId).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
      setClientEventEntries(filteredEntries);
    } else {
      setClientEventEntries([]);
    }
  }, [selectedContactId, allEventEntries]);


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
        subject: subject,
        detailsHtml: detailsHtml,
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
    
    const currentEditorContent = editorRef.current?.innerHTML || detailsHtml;

    const newEntry: EventEntry = {
      id: `entry-${Date.now()}`,
      contactId,
      contactName: contact.name,
      subject: subject,
      detailsHtml: currentEditorContent,
      startTime: new Date(Date.now() - elapsedTime * 1000),
      endTime: new Date(),
      duration: elapsedTime,
      billableRate,
    };
    
    const updatedEntries = [newEntry, ...allEventEntries];
    localStorage.setItem('eventEntries', JSON.stringify(updatedEntries));
    setAllEventEntries(updatedEntries); // Update state to trigger re-filter
    
    setIsActive(false);
    setIsPaused(false);
    setElapsedTime(0);
    setSubject("");
    setDetailsHtml("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setSelectedContactId(null);
    clearStateFromLocalStorage();

    toast({ title: "Event Logged", description: `Logged ${formatTime(elapsedTime)} for ${contact.name}.` });
  };
  
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };
  
  const preventDefault = (e: React.MouseEvent) => e.preventDefault();
  
  const selectedContact = mockContacts.find(c => c.id === selectedContactId);
  const currentBillableAmount = isActive ? (elapsedTime / 3600) * billableRate : 0;

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold font-headline text-primary">Event Manager</h1>
          <p className="text-muted-foreground">Select a client to manage their events and track time.</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <div className="space-y-6">
                <Card>
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
                
                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                        <CardDescription>Add detailed, formatted notes about the event.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col p-0">
                        <div className="p-2 border-t border-b flex items-center gap-1 flex-wrap">
                            <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                            <Separator orientation="vertical" className="h-6 mx-1" />
                            <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                        </div>
                        <ScrollArea className="flex-1 min-h-[200px]">
                            <div
                                ref={editorRef}
                                className="prose dark:prose-invert max-w-none p-4 focus:outline-none h-full"
                                contentEditable={!isActive}
                                onInput={(e) => setDetailsHtml(e.currentTarget.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: detailsHtml }}
                                placeholder="Start writing your event details here..."
                                dir="ltr"
                            />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Logged Events for {selectedContact?.name || '...'}</CardTitle>
                    <CardDescription>A record of tracked time for the selected client.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ScrollArea className="h-[400px] border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="text-right">Duration</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientEventEntries.length > 0 ? clientEventEntries.map(entry => (
                                    <TableRow key={entry.id} onClick={() => setSelectedLogEntry(entry)} className="cursor-pointer">
                                        <TableCell>{entry.subject}</TableCell>
                                        <TableCell className="text-right font-mono">{formatTime(entry.duration)}</TableCell>
                                        <TableCell className="text-right font-mono">${((entry.duration / 3600) * entry.billableRate).toFixed(2)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                            {selectedContactId ? 'No events logged for this client yet.' : 'Please select a client to view their events.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/reports/billable-hours">
                            <BookOpen className="mr-2 h-4 w-4"/>
                            View Full Billable Hours Report
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
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
      <EventDetailsDialog 
            isOpen={!!selectedLogEntry}
            onOpenChange={() => setSelectedLogEntry(null)}
            entry={selectedLogEntry}
        />
    </>
  );
}
