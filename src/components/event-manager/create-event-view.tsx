"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, BookOpen, Bold, Italic, Underline, List, ListOrdered, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { type Contact, mockContacts } from "@/data/contacts";
import { TimerDialog } from './timer-dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '../ui/scroll-area';

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

export function CreateEventView() {
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
    try {
        if (!selectedContactId) {
            toast({ variant: "destructive", title: "Cannot Log Event", description: "No client is selected." });
            return;
        }
    
        const contact = mockContacts.find(c => c.id === selectedContactId);
        if (!contact) {
            toast({ variant: "destructive", title: "Cannot Log Event", description: "Selected client could not be found." });
            return;
        }
        
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
        
        const existingEntriesRaw = localStorage.getItem('eventEntries');
        const existingEntries = existingEntriesRaw ? JSON.parse(existingEntriesRaw) : [];
        const updatedEntries = [newEntry, ...existingEntries];
        localStorage.setItem('eventEntries', JSON.stringify(updatedEntries));
        
        setIsActive(false);
        setIsPaused(false);
        setElapsedTime(0);
        setSubject("");
        setDetailsHtml("");
        if (editorRef.current) editorRef.current.innerHTML = "";
        setSelectedContactId(null);
        clearStateFromLocalStorage();

        toast({ title: "Event Logged", description: `Logged ${formatTime(elapsedTime)} for ${contact.name}.` });
    } catch (error) {
        console.error("Error logging event:", error);
        toast({
            variant: "destructive",
            title: "Error Logging Event",
            description: "Could not save the event. Please check the console for details."
        });
        // Also reset state on error to avoid being stuck
        setIsActive(false);
        setIsPaused(false);
        clearStateFromLocalStorage();
    }
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
        <header className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline text-primary">Create Event</h1>
                <p className="text-muted-foreground">Select a client, track time, and describe the event.</p>
            </div>
            <Button asChild>
                <Link href="/event-manager">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Event Hub
                </Link>
            </Button>
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
                 <Button asChild variant="secondary">
                   <Link href="/event-manager/logged-events">
                       <BookOpen className="mr-2 h-4 w-4"/>
                       View Events
                   </Link>
                </Button>
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
          
          <CardHeader className="pt-0">
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
              <ScrollArea className="flex-1 min-h-[250px]">
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
