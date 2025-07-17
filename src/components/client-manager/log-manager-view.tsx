
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { getClientAccounts, addEventEntry, type ClientAccount, type EventEntry } from '@/services/client-manager-service';
import { TimeClockDialog } from '@/components/time/TimeClockDialog';
import { LoaderCircle } from 'lucide-react';

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function LogManagerView() {
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [billableRate, setBillableRate] = useState<number>(100);
  
  const [isTimeClockOpen, setIsTimeClockOpen] = useState(false);
  const [loggedSeconds, setLoggedSeconds] = useState(0);

  const { toast } = useToast();

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

  const handleLogTime = (seconds: number) => {
    setLoggedSeconds(seconds);
    toast({
      title: "Time Logged",
      description: `Timer stopped. ${formatTime(seconds)} is ready to be saved with this entry.`
    });
  };

  const handleLogEvent = async () => {
    if (!user) { toast({ variant: "destructive", title: "Not logged in" }); return; }

    try {
        if (!selectedAccountId) {
            toast({ variant: "destructive", title: "Cannot Log Entry", description: "No client is selected." });
            return;
        }
        if (loggedSeconds === 0) {
            toast({ variant: "destructive", title: "Cannot Log Entry", description: "No time has been logged for this entry. Please use the time clock." });
            return;
        }
    
        const account = clientAccounts.find(c => c.id === selectedAccountId);
        if (!account) {
            toast({ variant: "destructive", title: "Cannot Log Entry", description: "Selected client could not be found." });
            return;
        }
        
        const newEntryData: Omit<EventEntry, 'id'> = {
            accountId: selectedAccountId,
            contactName: account.name,
            subject: subject,
            detailsHtml: details.replace(/\n/g, '<br>'), // Simple text to HTML
            startTime: new Date(Date.now() - loggedSeconds * 1000),
            endTime: new Date(),
            duration: loggedSeconds,
            billableRate,
            userId: user.uid,
        };
        
        await addEventEntry(newEntryData);
        
        setLoggedSeconds(0);
        setSubject("");
        setDetails("");
        setSelectedAccountId(null);
        localStorage.removeItem('timeClockDialogState');

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
            <h1 className="text-3xl font-bold font-headline text-primary">Client Log Manager</h1>
            <p className="text-muted-foreground">Log a new time entry for a client.</p>
        </header>

        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>New Log Entry</CardTitle>
                <CardDescription>Select a client, track time, and describe the action taken.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="client-select-log">Client</Label>
                        <Select value={selectedAccountId ?? ''} onValueChange={setSelectedAccountId}>
                            <SelectTrigger id="client-select-log">
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
                        <Label htmlFor="billable-rate-log">Billable Rate ($/hr)</Label>
                        <Input
                            id="billable-rate-log"
                            type="number"
                            value={billableRate}
                            onChange={(e) => setBillableRate(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subject-log">Subject / Task Description</Label>
                    <Input
                        id="subject-log"
                        placeholder="e.g., Drafting initial project proposal"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="details-log">Details</Label>
                    <textarea
                        id="details-log"
                        rows={8}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        placeholder="Provide details about the work performed."
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                    />
                </div>
                 <div className="flex justify-center items-center gap-4">
                    <div className="text-center">
                        <p className="text-muted-foreground text-sm">Time Logged</p>
                        <p className="font-mono text-2xl font-bold">{formatTime(loggedSeconds)}</p>
                    </div>
                    <Button size="lg" onClick={() => setIsTimeClockOpen(true)} disabled={!selectedAccountId || !subject.trim()}>
                        <Clock className="mr-2 h-5 w-5" /> Open Time Clock
                    </Button>
                </div>
            </CardContent>
             <CardFooter className="flex justify-end">
                <Button onClick={handleLogEvent}>
                    <Save className="mr-2 h-4 w-4"/>
                    Log Entry
                </Button>
            </CardFooter>
        </Card>
    </div>
    <TimeClockDialog
        isOpen={isTimeClockOpen}
        onOpenChange={setIsTimeClockOpen}
        onLogTime={handleLogTime}
      />
    </>
  );
}
