
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bold, Italic, Underline, List, ListOrdered, ArrowLeft, Settings as SettingsIcon, Play, Pause, Square, Save, RotateCcw, Strikethrough, Quote, Link as LinkIcon, Mic } from 'lucide-react';
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
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { cn } from '@/lib/utils';


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

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function CreateEventView() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false); // Timer has been started and not stopped/reset
  const [isPaused, setIsPaused] = useState(true);  // Timer is paused
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [detailsBeforeSpeech, setDetailsBeforeSpeech] = useState('');

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

  const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
    onTranscript: (transcript) => {
        if (editorRef.current) {
            const newText = detailsBeforeSpeech ? `${detailsBeforeSpeech} ${transcript}`.trim() : transcript;
            editorRef.current.innerHTML = newText;
            const range = document.createRange();
            const sel = window.getSelection();
            if (sel) {
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
  });
  
  const handleStart = () => {
    if (!selectedContactId) {
        toast({ variant: "destructive", title: "Cannot Start Timer", description: "A client must be selected first." });
        return;
    }
    setElapsedTime(0);
    setIsActive(true);
    setIsPaused(false);
  };
  
  const handlePauseResume = () => {
      if (!isActive) return;
      setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(true);
    // The "Save to Log" button is now the explicit action to log the time.
    // This button just stops the clock. The time is preserved until reset or a new timer is started.
    toast({ title: "Timer Stopped", description: `Final time: ${formatTime(elapsedTime)}` });
  }
  
  const handleReset = () => {
    setIsActive(false);
    setIsPaused(true);
    setElapsedTime(0);
  }

  const handleLogEvent = () => {
    try {
        if (!selectedContactId) {
            toast({ variant: "destructive", title: "Cannot Log Event", description: "No client is selected." });
            return;
        }
        if (elapsedTime === 0 && !isActive) {
            toast({ variant: "destructive", title: "Cannot Log Event", description: "The timer has not been run for this event." });
            return;
        }
    
        const contact = mockContacts.find(c => c.id === selectedContactId);
        if (!contact) {
            toast({ variant: "destructive", title: "Cannot Log Event", description: "Selected client could not be found." });
            return;
        }
        
        const currentEditorContent = editorRef.current?.innerHTML || '';
        // In a real application, you would get the billable rate from state.
        // For this mock, we'll use a default if it's not set.
        const billableRateForEntry = 100;

        const newEntry: EventEntry = {
            id: `entry-${Date.now()}`,
            contactId,
            contactName: contact.name,
            subject: subject,
            detailsHtml: currentEditorContent,
            startTime: new Date(Date.now() - elapsedTime * 1000),
            endTime: new Date(),
            duration: elapsedTime,
            billableRate: billableRateForEntry,
        };
        
        const existingEntriesRaw = localStorage.getItem('eventEntries');
        const existingEntries = existingEntriesRaw ? JSON.parse(existingEntriesRaw) : [];
        const updatedEntries = [newEntry, ...existingEntries];
        localStorage.setItem('eventEntries', JSON.stringify(updatedEntries));
        
        handleReset();
        setSubject("");
        if (editorRef.current) editorRef.current.innerHTML = "";
        setSelectedContactId(null);

        toast({ title: "Event Logged", description: `Logged ${formatTime(newEntry.duration)} for ${contact.name}.` });
    } catch (error) {
        console.error("Error logging event:", error);
        toast({
            variant: "destructive",
            title: "Error Logging Event",
            description: "Could not save the event. Please check the console for details."
        });
    }
  };
  
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };
  
  const preventDefault = (e: React.MouseEvent) => e.preventDefault();
  
  const handleDictateNotes = () => {
    if (isListening) {
      stopListening();
    } else {
      setDetailsBeforeSpeech(editorRef.current?.innerHTML || '');
      editorRef.current?.focus();
      startListening();
    }
  };

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
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Event Settings & Timer</DialogTitle>
                        <DialogDescription>
                            Configure billing options and track time for this event.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h4 className="font-semibold">Time Clock</h4>
                            <div className="py-8 text-center">
                                <p className="text-6xl font-mono font-bold text-primary tracking-tight">
                                    {formatTime(elapsedTime)}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                               <Button onClick={handleStart} disabled={isActive}><Play className="mr-2 h-5 w-5" /> Start</Button>
                               <Button onClick={handlePauseResume} variant="outline" disabled={!isActive}>{isPaused && isActive ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}{isPaused && isActive ? 'Resume' : 'Pause'}</Button>
                               <Button onClick={handleStop} variant="destructive" disabled={!isActive}><Square className="mr-2 h-5 w-5" /> Stop</Button>
                               <Button onClick={handleReset} variant="destructive-outline" disabled={elapsedTime === 0 && !isActive}><RotateCcw className="mr-2 h-5 w-5" /> Reset</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSettingsDialogOpen(false)}>Close</Button>
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
               <div className="ml-auto">
                  <Button onClick={handleLogEvent}><Save className="mr-2 h-4 w-4"/> Save to Log</Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col p-0">
                <div className="p-2 border-t border-b flex items-center gap-1 flex-wrap">
                    <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Strikethrough" onMouseDown={preventDefault} onClick={() => handleFormat('strikeThrough')}><Strikethrough className="h-4 w-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Blockquote" onMouseDown={preventDefault} onClick={() => handleFormat('formatBlock', 'blockquote')}><Quote className="h-4 w-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" title="Insert Link" onMouseDown={preventDefault} onClick={() => { const url = prompt('Enter a URL:'); if (url) handleFormat('createLink', url); }}><LinkIcon className="h-4 w-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" title={isListening ? "Stop dictation" : "Dictate notes"} onMouseDown={preventDefault} onClick={handleDictateNotes} disabled={isSupported === false} className={cn(isListening && "text-destructive")}>
                        {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                </div>
                <div
                    ref={editorRef}
                    className="prose dark:prose-invert max-w-none p-4 focus:outline-none h-full min-h-[250px] text-left"
                    contentEditable
                    onInput={(e) => {}}
                    placeholder="Start writing your event details here..."
                />
            </CardContent>
          </Card>
      </div>
    </>
  );
}
