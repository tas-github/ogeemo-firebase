'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { EventDetailsDialog } from "@/components/event-manager/event-details-dialog";

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

export default function LoggedEventsPage() {
  const [eventEntries, setEventEntries] = useState<EventEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<EventEntry | null>(null);

  useEffect(() => {
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
  }, []);
  
  const totalBillable = eventEntries.reduce((acc, entry) => {
    const hours = entry.duration / 3600;
    return acc + (hours * entry.billableRate);
  }, 0).toFixed(2);

  return (
    <>
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary">Client Event Log</h1>
                    <p className="text-muted-foreground">A detailed record of all tracked client events.</p>
                </div>
                <Button asChild>
                    <Link href="/event-manager">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Event Manager
                    </Link>
                </Button>
            </header>

            <Card className="max-w-6xl mx-auto">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Event History</CardTitle>
                            <CardDescription>Click a row to view full details.</CardDescription>
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
                                    <TableRow key={entry.id} onClick={() => setSelectedEntry(entry)} className="cursor-pointer">
                                        <TableCell className="font-medium">{entry.contactName}</TableCell>
                                        <TableCell>{entry.subject}</TableCell>
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
        <EventDetailsDialog 
            isOpen={!!selectedEntry}
            onOpenChange={() => setSelectedEntry(null)}
            entry={selectedEntry}
        />
    </>
  );
}
