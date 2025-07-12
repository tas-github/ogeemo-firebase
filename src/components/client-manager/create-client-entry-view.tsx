'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bold, Italic, Underline, List, ListOrdered, ArrowLeft, Play, Pause, Square, Save, Strikethrough, Quote, Link as LinkIcon, Mic, LoaderCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { getClientAccounts, addEventEntry, type ClientAccount, type EventEntry } from '@/services/client-manager-service';

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
  const [subject, setSubject] = useState("");
  const [billableRate, setBillableRate] = useState<number>(100);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [detailsBeforeSpeech, setDetailsBeforeSpeech] = useState('');

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
  

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
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
    if (!selectedAccountId) {
        toast({ variant: "destructive", title: "Cannot Start Timer", description: "A client must be selected first." });
        return;
    }
    if (!subject.trim()) {
      toast({ variant: "destructive", title: "Subject Required", description: "Please enter a subject for the entry." });
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

  const handleLogEvent = async () => {
    if (!user) { toast({ variant: "destructive", title: "Not logged in" }); return; }
    try {
        if (!selectedAccountId) {
            toast({ variant: "destructive", title: "Cannot Log Entry", description: "No client is selected." });
            return;
        }
        if (elapsedTime === 0) {
            toast({ variant: "destructive", title: "Cannot Log Entry", description: "The timer has not been run for this entry." });
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
            startTime: new Date(Date.now() - elapsedTime * 1000),
            endTime: new Date(),
            duration: elapsedTime,
            billableRate,
            userId: user.uid,
        };
        
        await addEventEntry(newEntryData);
        
        setIsActive(false);
        setIsPaused(true);
        setElapsedTime(0);
        setSubject("");
        if (editorRef.current) editorRef.current.innerHTML = "";
        setSelectedAccountId(null);

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

  return (
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
                <CardTitle>Client & Task Details</CardTitle>
                <CardDescription>All fields are required to start the timer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">Client</Label>
                        <Select value={selectedAccountId ?? ''} onValueChange={setSelectedAccountId} disabled={isActive}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder={isLoading ? "Loading clients..." : "Select a client..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? <div className="p-2"><LoaderCircle className="h-4 w-4 animate-spin"/></div> :
                                clientAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
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
                    <Label htmlFor="subject">Subject / Task Description</Label>
                    <Input
                        id="subject"
                        placeholder="e.g., Drafting initial project proposal"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={isActive}
                    />
                </div>
            </CardContent>
        </Card>
        
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Time Clock</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-6">
                <div className="text-6xl font-mono font-bold text-primary tracking-tighter">
                    {formatTime(elapsedTime)}
                </div>
                {isActive && selectedAccountId && (
                    <p className="text-muted-foreground mt-2">
                        Timer is running for <span className="font-semibold text-primary">{clientAccounts.find(c=>c.id === selectedAccountId)?.name}</span>
                    </p>
                )}
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
                 {!isActive ? (
                    <Button size="lg" onClick={handleStart} className="w-48">
                        <Play className="mr-2 h-5 w-5" /> Start Timer
                    </Button>
                ) : (
                    <Button size="lg" variant="outline" onClick={handlePauseResume} className="w-48">
                        {isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
                        {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                )}
            </CardFooter>
        </Card>

        <Card className="max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <div>
                    <CardTitle>Detailed Notes</CardTitle>
                    <CardDescription>Use this space for detailed descriptions of actions performed.</CardDescription>
                </div>
                <Button onClick={handleLogEvent} disabled={elapsedTime === 0 || isActive}>
                    <Save className="mr-2 h-4 w-4"/>
                    Stop & Log Entry
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
  );
}
