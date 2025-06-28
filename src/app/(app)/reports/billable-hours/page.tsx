
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsPageHeader } from "@/components/reports/page-header";
import { EventDetailsDialog } from "@/components/event-manager/event-details-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export default function BillableHoursReportPage() {
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
        <div className="p-4 sm:p-6 flex flex-col h-full space-y-6">
            <ReportsPageHeader pageTitle="Billable Hours Report" />
            <header className="text-center">
                <h1 className="text-3xl font-bold font-headline text-primary">
                Billable Hours Report
                </h1>
                <p className="text-muted-foreground">
                A comprehensive record of all your tracked time for clients.
                </p>
            </header>

            <Card className="max-w-6xl mx-auto flex-1 flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>All Logged Events</CardTitle>
                            <CardDescription>Click a row to view full details.</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Billable</p>
                            <p className="text-2xl font-bold text-primary">${totalBillable}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                    <ScrollArea className="h-full border rounded-lg">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted z-10">
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
                    </ScrollArea>
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
