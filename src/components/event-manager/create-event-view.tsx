
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Bold, Italic, Underline, List, ListOrdered, ArrowLeft, Settings as SettingsIcon, Play, Pause, Square, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { type Contact, mockContacts } from "@/data/contacts";
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from '../ui/checkbox';

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
  const [isBillable, setIsBillable] = useState(false);
  const [billableRate, setBillableRate] = useState<number>(100);
  const [subject, setSubject] = useState("");
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [editorContent, setEditorContent] = useState('');
  
  const isTyping = useRef(false);

  const saveStateToLocalStorage = useCallback(() => {
    if (!selectedContactId || !isActive) return;
    const state: StoredTimerState = {
        contactId: selectedContactId,
        subject,
        detailsHtml: editorRef.current?.innerHTML || '',
        billableRate,
        isPaused,
        elapsedTime,
        lastTickTimestamp: Date.now()
    };
    localStorage.setItem('activeTimerState', JSON.stringify(state));
  }, [isPaused, isActive, selectedContactId, subject, billableRate, elapsedTime]);

  const clearStateFromLocalStorage = useCallback(() => {
    localStorage.removeItem('activeTimerState');
  }, []);

  // Load state from local storage on initial mount
  useEffect(() => {
    const savedStateRaw = localStorage.getItem('activeTimerState');
    if (savedStateRaw) {
      try {
        const state: StoredTimerState = JSON.parse(savedStateRaw);
        setSelectedContactId(state.contactId);
        setSubject(state.subject);
        setEditorContent(state.detailsHtml || "");
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

  // Sync editor content only when component mounts or content changes externally
  useEffect(() => {
    if (editorRef.current && !isTyping.current && editorRef.current.innerHTML !== editorContent) {
      editorRef.current.innerHTML = editorContent;
    }
  }, [editorContent]);
  
  // Timer interval effect
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
    setIsActive(true);
    setIsPaused(false);
    setElapsedTime(0);
  };

  const handlePauseResume = () => {
      setIsPaused(!isPaused);
  };
  
  const handleStopAndReset = () => {
    setIsActive(false);
    setIsPaused(true);
    setElapsedTime(0);
    clearStateFromLocalStorage();
    toast({ title: "Timer Reset", description: "The timer has been stopped and reset." });
  }

  // Save state to local storage when paused or active state changes
  useEffect(() => {
      if(isActive) {
        saveStateToLocalStorage();
      }
  }, [isPaused, isActive, saveStateToLocalStorage]);
  
  const resetFormAndTimer = useCallback(() => {
    setIsActive(false);
    setIsPaused(true);
    setElapsedTime(0);
    setSubject("");
    setEditorContent("");
    setSelectedContactId(null);
    setIsBillable(false);
    setBillableRate(100);
    clearStateFromLocalStorage();
  }, [clearStateFromLocalStorage]);

  const handleLogEvent = () => {
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
        
        const currentEditorContent = editorRef.current?.innerHTML || '';

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
        
        resetFormAndTimer();
        toast({ title: "Event Logged", description: `Logged ${formatTime(elapsedTime)} for ${contact.name}.` });
        setIsSettingsDialogOpen(false);
    } catch (error) {
        console.error("Error logging event:", error);
        toast({
            variant: "destructive",
            title: "Error Logging Event",
            description: "Could not save the event. Please check the console for details."
        });
        resetFormAndTimer();
        setIsSettingsDialogOpen(false);
    }
  };
  
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };
  
  const preventDefault = (e: React.MouseEvent) => e.preventDefault();
  
  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
          <header className="relative text-center">
              <div className="absolute left-0 top-1/2 -translate-y-1/2">
                <Button asChild>
                    <Link href="/event-manager">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Event Hub
                    </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold font-headline text-primary">Create Event</h1>
              <p className="text-muted-foreground">Select a client, track time, and describe the action taken.</p>
          </header>

          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
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
              <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Event Settings</DialogTitle>
                        <DialogDescription>
                            Configure billing options and track time for this event.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="is-billable" checked={isBillable} onCheckedChange={(checked) => setIsBillable(!!checked)} />
                                <Label htmlFor="is-billable">This event is billable</Label>
                            </div>
                            {isBillable && (
                                <div className="flex items-center gap-2 pl-6">
                                    <Label htmlFor="billable-rate">Billable Rate ($/hr)</Label>
                                    <Input
                                        id="billable-rate"
                                        type="number"
                                        value={billableRate}
                                        onChange={(e) => setBillableRate(Number(e.target.value))}
                                        placeholder="100"
                                        className="w-24"
                                    />
                                </div>
                            )}
                        </div>
                        <Separator />
                        <div>
                            <Label>Time Clock</Label>
                            <div className="py-8 text-center">
                                <p className="text-6xl font-mono font-bold text-primary tracking-tight">
                                    {formatTime(elapsedTime)}
                                </p>
                            </div>
                            <div className="flex justify-center gap-4">
                                {!isActive ? (
                                    <Button onClick={handleStart} className="w-full">
                                        <Play className="mr-2 h-5 w-5" /> Start
                                    </Button>
                                ) : (
                                    <>
                                        <Button onClick={handlePauseResume} variant="outline" className="flex-1">
                                            {isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
                                            {isPaused ? 'Resume' : 'Pause'}
                                        </Button>
                                        <Button onClick={handleStopAndReset} variant="destructive" className="flex-1">
                                            <Square className="mr-2 h-5 w-5" /> Reset
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSettingsDialogOpen(false)}>Close</Button>
                         <Button onClick={handleLogEvent} disabled={elapsedTime === 0}>
                            <Save className="mr-2 h-4 w-4" /> Save to Log
                        </Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-4 flex items-center gap-4">
              <Label htmlFor="subject" className="text-sm font-semibold whitespace-nowrap">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter a subject for the event..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-baseline gap-4 p-4">
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground">Describe event actions performed</p>
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
                <div
                    ref={editorRef}
                    className="prose dark:prose-invert max-w-none p-4 focus:outline-none h-full min-h-[250px] text-left"
                    dir="ltr"
                    contentEditable
                    onFocus={() => isTyping.current = true}
                    onBlur={(e) => {
                        isTyping.current = false;
                        if(editorRef.current?.innerHTML !== e.currentTarget.innerHTML) {
                            setEditorContent(e.currentTarget.innerHTML);
                        }
                    }}
                    onInput={(e) => {
                        if (!isTyping.current) return;
                        setEditorContent(e.currentTarget.innerHTML);
                    }}
                    placeholder="Start writing your event details here..."
                />
            </CardContent>
          </Card>
      </div>
    </>
  );
}
