
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bold, Italic, Underline, List, ListOrdered, ArrowLeft, Save, Strikethrough, Quote, Link as LinkIcon, Mic, Square, LoaderCircle, Clock, ChevronsUpDown, Check, MoreVertical, Play, Pause } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { getClientAccounts, addEventEntry, type ClientAccount, type EventEntry } from '@/services/client-manager-service';
// import { TimeClockDialog } from '@/components/time/TimeClockDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const TIMER_STORAGE_KEY = 'timeClockDialogState';

interface StoredTimerState {
    elapsedSeconds: number;
    isActive: boolean;
    isPaused: boolean;
    lastTickTimestamp: number;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function CreateClientEntryView() {
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isContactPopoverOpen, setIsContactPopoverOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [billableRate, setBillableRate] = useState<number>(100);
  
  const [loggedSeconds, setLoggedSeconds] = useState(0);

  // Live timer state
  const [runningTime, setRunningTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(true);

  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [detailsBeforeSpeech, setDetailsBeforeSpeech] = useState('');

  const loadTimerState = useCallback(() => {
    try {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (savedStateRaw) {
            const savedState: StoredTimerState = JSON.parse(savedStateRaw);
            const timeSinceLastTick = !savedState.isPaused && savedState.isActive ? Math.floor((Date.now() - savedState.lastTickTimestamp) / 1000) : 0;
            setRunningTime(savedState.elapsedSeconds + timeSinceLastTick);
            setIsTimerActive(savedState.isActive);
            setIsTimerPaused(savedState.isPaused);
            return savedState;
        }
    } catch (e) { console.error("Could not parse timer state", e); }
    return null;
  }, []);

  useEffect(() => {
    loadTimerState();
    const timerInterval = setInterval(() => {
        loadTimerState();
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [loadTimerState]);
  

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const accounts = await getClientAccounts(user.uid);
        setClientAccounts(accounts);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to load clients", description: error.message });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, toast]);
  

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
  
  const handleLogTime = (seconds: number) => {
    setLoggedSeconds(seconds);
    const timeString = formatTime(seconds);
    toast({
      title: "Time Logged",
      description: `Timer stopped. ${timeString} is ready to be saved with this entry.`
    });
  };

  const handleStartTimer = () => {
    const newState: StoredTimerState = {
        elapsedSeconds: 0,
        isActive: true,
        isPaused: false,
        lastTickTimestamp: Date.now(),
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(newState));
    loadTimerState();
  };

  const handlePauseResumeTimer = () => {
    const currentStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!currentStateRaw) return;

    const currentState: StoredTimerState = JSON.parse(currentStateRaw);
    if (!currentState.isActive) return;

    const timeSinceLastTick = !currentState.isPaused ? Math.floor((Date.now() - currentState.lastTickTimestamp) / 1000) : 0;
    const newElapsed = currentState.elapsedSeconds + timeSinceLastTick;

    const newState: StoredTimerState = {
        elapsedSeconds: newElapsed,
        isActive: true,
        isPaused: !currentState.isPaused,
        lastTickTimestamp: Date.now(),
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(newState));
    loadTimerState();
  };
  
  const handleStopTimerAndLog = () => {
    const currentStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!currentStateRaw) return;

    const currentState: StoredTimerState = JSON.parse(currentStateRaw);
    if (!currentState.isActive) return;

    const timeSinceLastTick = !currentState.isPaused ? Math.floor((Date.now() - currentState.lastTickTimestamp) / 1000) : 0;
    const finalSeconds = currentState.elapsedSeconds + timeSinceLastTick;
    
    handleLogTime(finalSeconds);

    localStorage.removeItem(TIMER_STORAGE_KEY);
    setRunningTime(0);
    setIsTimerActive(false);
    setIsTimerPaused(true);
  };

  const handleLogEvent = async () => {
    if (!user) { toast({ variant: "destructive", title: "Not logged in" }); return; }

    const finalLoggedSeconds = loggedSeconds > 0 ? loggedSeconds : isTimerActive ? runningTime : 0;

    try {
        if (!selectedAccountId) {
            toast({ variant: "destructive", title: "Cannot Log Entry", description: "No client is selected." });
            return;
        }
        if (finalLoggedSeconds === 0) {
            toast({ variant: "destructive", title: "Cannot Log Entry", description: "No time has been logged for this entry. Please use the time clock." });
            return;
        }
    
        const account = clientAccounts.find(c => c.id === selectedAccountId);
        if (!account) {
            toast({ variant: "destructive", title: "Cannot Log Entry", description: "Selected client could not be found." });
            return;
        }
        
        const currentEditorContent = editorRef.current?.innerHTML || '';
        
        const newEntryData: Omit<EventEntry, 'id'> = {
            accountId: selectedAccountId,
            contactName: account.name,
            subject: subject,
            detailsHtml: currentEditorContent,
            startTime: new Date(Date.now() - finalLoggedSeconds * 1000),
            endTime: new Date(),
            duration: finalLoggedSeconds,
            billableRate,
            userId: user.uid,
        };
        
        await addEventEntry(newEntryData);
        
        setLoggedSeconds(0);
        setRunningTime(0);
        setIsTimerActive(false);
        setIsTimerPaused(true);
        setSubject("");
        if (editorRef.current) editorRef.current.innerHTML = "";
        setSelectedAccountId(null);
        localStorage.removeItem(TIMER_STORAGE_KEY);

        toast({ title: "Entry Logged", description: `Logged ${formatTime(newEntryData.duration)} for ${account.name}.` });
    } catch (error) {
        console.error("Error logging event:", error);
        toast({
            variant: "destructive",
            title: "Error Logging Entry",
            description: "Could not save the entry. Please check the console for details."
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

  const displayTime = runningTime > 0 ? runningTime : loggedSeconds;

  return (
    <>
    <div className="p-4 sm:p-6 space-y-6">
        <header className="relative text-center">
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <Button asChild>
                  <Link href="/client-manager">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Hub
                  </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold font-headline text-primary">Create Client Log Entry</h1>
            <p className="text-muted-foreground">Select a client, track time, and describe the action taken.</p>
        </header>

        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                 <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Client & Task Details</CardTitle>
                        <CardDescription>All fields are required to start the timer.</CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-muted-foreground text-sm">Time Logged</p>
                        <div className="flex items-center gap-2">
                            <p className={cn("font-mono text-2xl font-bold", isTimerActive && !isTimerPaused && 'text-destructive animate-pulse')}>{formatTime(displayTime)}</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleStartTimer} disabled={isTimerActive}>
                                        <Play className="mr-2 h-4 w-4" /> Start Timer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handlePauseResumeTimer} disabled={!isTimerActive}>
                                        {isTimerPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                                        {isTimerPaused ? 'Resume' : 'Pause'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleStopTimerAndLog} disabled={!isTimerActive} className="text-destructive">
                                        <Square className="mr-2 h-4 w-4" /> Stop & Log Time
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">Client</Label>
                        <div className="border p-2 rounded-md">
                            <Popover open={isContactPopoverOpen} onOpenChange={setIsContactPopoverOpen}>
                                <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isContactPopoverOpen}
                                    className="w-full justify-between"
                                >
                                    {selectedAccountId
                                    ? clientAccounts.find((account) => account.id === selectedAccountId)?.name
                                    : "Select client..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput
                                    placeholder="Search clients..."
                                    className="h-9 m-2 p-2 rounded-md border-foreground bg-muted/50"
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            {isLoading ? (
                                                <div className="flex items-center justify-center p-2"><LoaderCircle className="h-4 w-4 animate-spin"/></div>
                                            ) : (
                                                "No client found."
                                            )}
                                        </CommandEmpty>
                                        <CommandGroup>
                                        {clientAccounts.map((account) => (
                                            <CommandItem
                                                key={account.id}
                                                value={account.name}
                                                onSelect={() => {
                                                    setSelectedAccountId(account.id);
                                                    setIsContactPopoverOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedAccountId === account.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {account.name}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="billable-rate">Billable Rate ($/hr)</Label>
                        <Input
                            id="billable-rate"
                            type="number"
                            value={billableRate}
                            onChange={(e) => setBillableRate(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject / Task Description</Label>
                    <Input
                        id="subject"
                        placeholder="e.g., Drafting initial project proposal"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>
        
        <Card className="max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <div>
                    <CardTitle>Detailed Notes</CardTitle>
                    <CardDescription>Use this space for detailed descriptions of actions performed.</CardDescription>
                </div>
                <Button onClick={handleLogEvent}>
                    <Save className="mr-2 h-4 w-4"/>
                    Log Entry with Time
                </Button>
            </CardHeader>
            <CardContent className="flex flex-col p-0">
                <div className="p-2 border-y flex items-center gap-1 flex-wrap">
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
                    className="prose dark:prose-invert max-w-none p-4 focus:outline-none min-h-[250px] text-left"
                    contentEditable
                    placeholder="Start writing your event details here..."
                />
            </CardContent>
        </Card>
    </div>
    {/* 
    <TimeClockDialog
        isOpen={isTimeClockOpen}
        onOpenChange={setIsTimeClockOpen}
        onLogTime={handleLogTime}
      /> 
    */}
    </>
  );
}
