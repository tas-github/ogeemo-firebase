
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Bold, Italic, Underline, List, ListOrdered, ArrowLeft, Settings as SettingsIcon, Play, Pause, Square, Save, RotateCcw } from 'lucide-react';
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
  const [isActive, setIsActive] = useState(false); // Timer has been started and not stopped/reset
  const [isPaused, setIsPaused] = useState(true);  // Timer is paused
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
    setElapsedTime(0);
    setIsActive(true);
    setIsPaused(false);
  };
  
  const handlePauseResume = () => {
      if (!isActive) return;
      setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsPaused(true);
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
        if (elapsedTime === 0) {
            toast({ variant: "destructive", title: "Cannot Log Event", description: "The timer has not been run." });
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
        
        // Reset form and timer
        handleReset();
        setSubject("");
        if (editorRef.current) editorRef.current.innerHTML = "";
        setSelectedContactId(null);
        setIsBillable(false);
        setBillableRate(100);

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
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="is-billable" checked={isBillable} onCheckedChange={(checked) => setIsBillable(!!checked)} />
                                <Label htmlFor="is-billable">This event is billable</Label>
                            </div>
                            {isBillable && (
                                <div className="flex items-center gap-2 pl-6">
                                    <Label htmlFor="billable-rate" className="whitespace-nowrap">Billable Rate ($/hr)</Label>
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
                            <div className="grid grid-cols-2 gap-4">
                               <Button onClick={handleStart} disabled={isActive}><Play className="mr-2 h-5 w-5" /> Start</Button>
                               <Button onClick={handlePauseResume} variant="outline" disabled={!isActive}>{isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}{isPaused && isActive ? 'Resume' : 'Pause'}</Button>
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
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                </div>
                <div
                    ref={editorRef}
                    className="prose dark:prose-invert max-w-none p-4 focus:outline-none h-full min-h-[250px] text-left"
                    dir="ltr"
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
