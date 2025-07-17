
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LoaderCircle, ChevronsUpDown, Check, Printer, Calendar as CalendarIcon, MoreVertical, Pencil, Trash2, BookOpen, FileDigit } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { type DateRange } from "react-day-picker";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from '@/hooks/use-react-to-print';
import { getClientAccounts, getEventEntries, updateEventEntry, deleteEventEntry, type ClientAccount, type EventEntry } from '@/services/client-manager-service';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EventDetailsDialog } from "@/components/client-manager/event-details-dialog";

const INVOICE_FROM_REPORT_KEY = 'invoiceFromReportData';


const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

const endOfDay = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
};


export function ClientTimeLogReport() {
    const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
    const [allEntries, setAllEntries] = useState<EventEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isContactPopoverOpen, setIsContactPopoverOpen] = useState(false);
    
    const [selectedEntry, setSelectedEntry] = useState<EventEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<EventEntry | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();
    const { handlePrint, contentRef } = useReactToPrint();
    const router = useRouter();


    useEffect(() => {
        async function loadData() {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [accounts, entries] = await Promise.all([
                    getClientAccounts(user.uid),
                    getEventEntries(user.uid),
                ]);
                setClientAccounts(accounts);
                setAllEntries(entries);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user, toast]);
    

    const filteredEntries = useMemo(() => {
        if (!selectedAccountId) return [];
        
        return allEntries
            .filter(entry => entry.accountId === selectedAccountId)
            .filter(entry => {
                if (!dateRange || !dateRange.from) return true;
                const entryDate = new Date(entry.startTime);
                const toDate = dateRange.to || dateRange.from;
                return entryDate >= dateRange.from && entryDate <= endOfDay(toDate);
            });
    }, [selectedAccountId, allEntries, dateRange]);

    const totalDuration = useMemo(() => filteredEntries.reduce((acc, entry) => acc + entry.duration, 0), [filteredEntries]);
    const totalBillable = useMemo(() => filteredEntries.reduce((acc, entry) => acc + (entry.duration / 3600) * entry.billableRate, 0), [filteredEntries]);
    
    const setMonthToDate = () => setDateRange({ from: startOfMonth(new Date()), to: new Date() });
    const setYearToDate = () => setDateRange({ from: startOfYear(new Date()), to: new Date() });
    
    const handleSaveEntry = async (updatedEntryData: Pick<EventEntry, 'id' | 'subject' | 'detailsHtml' | 'startTime' | 'endTime' | 'duration' | 'billableRate'>) => {
        try {
            await updateEventEntry(updatedEntryData.id, updatedEntryData);
            setAllEntries(prev => prev.map(e => e.id === updatedEntryData.id ? { ...e, ...updatedEntryData } : e));
            toast({ title: "Entry Updated", description: "Your changes have been saved." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        }
    };

    const handleConfirmDelete = async () => {
        if (!entryToDelete) return;
        try {
            await deleteEventEntry(entryToDelete.id);
            setAllEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
            toast({ title: "Entry Deleted", description: `The log entry "${entryToDelete.subject}" has been removed.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Delete Failed", description: error.message });
        } finally {
            setEntryToDelete(null);
        }
    };

    const handleCreateInvoice = () => {
        if (!selectedAccount || filteredEntries.length === 0) {
            toast({ variant: 'destructive', title: 'Cannot Create Invoice', description: 'Please select a client with time log entries in the selected range.'});
            return;
        }

        const lineItems = filteredEntries
            .filter(entry => entry.billableRate > 0 && entry.duration > 0)
            .map(entry => {
                const hours = entry.duration / 3600;
                return {
                    description: `${entry.subject} - ${format(entry.startTime, 'PPP')}`,
                    quantity: parseFloat(hours.toFixed(2)),
                    price: entry.billableRate,
                };
            });
        
        if (lineItems.length === 0) {
            toast({ variant: 'destructive', title: 'No Billable Items', description: 'There are no billable time entries in this report.'});
            return;
        }

        try {
            const invoiceData = {
                contactId: selectedAccount.contactId,
                lineItems: lineItems,
            };
            sessionStorage.setItem(INVOICE_FROM_REPORT_KEY, JSON.stringify(invoiceData));
            router.push('/accounting/invoices/create');
        } catch (error) {
            console.error('Failed to prepare invoice data:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not prepare the invoice data for generation.' });
        }
    };

    const selectedAccount = clientAccounts.find(c => c.id === selectedAccountId);

    return (
        <>
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary">Client Time Log Report</h1>
                    <p className="text-muted-foreground">Generate a detailed report of time logged for a client.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleCreateInvoice} disabled={!selectedAccountId}>
                        <FileDigit className="mr-2 h-4 w-4" />
                        Create Invoice
                    </Button>
                    <Button variant="outline" onClick={handlePrint} disabled={!selectedAccountId}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                    <Button asChild>
                        <Link href="/client-manager">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Client Hub
                        </Link>
                    </Button>
                </div>
            </header>

            <Card className="print:hidden">
                <CardHeader>
                    <CardTitle>Report Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <Popover open={isContactPopoverOpen} onOpenChange={setIsContactPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                    {selectedAccount?.name || "Select client..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command><CommandInput placeholder="Search clients..." /><CommandList><CommandEmpty>{isLoading ? <LoaderCircle className="h-4 w-4 animate-spin"/> : "No client found."}</CommandEmpty><CommandGroup>{clientAccounts.map(c => (<CommandItem key={c.id} value={c.name} onSelect={() => { setSelectedAccountId(c.id); setIsContactPopoverOpen(false); }}> <Check className={cn("mr-2 h-4 w-4", selectedAccountId === c.id ? "opacity-100" : "opacity-0")}/>{c.name}</CommandItem>))}</CommandGroup></CommandList></Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y") : <span>Pick a date range</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/></PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button variant="secondary" onClick={setMonthToDate} className="w-full">Month to Date</Button>
                        <Button variant="secondary" onClick={setYearToDate} className="w-full">Year to Date</Button>
                        <Button variant="secondary" onClick={() => setDateRange(undefined)} className="w-full">Clear</Button>
                    </div>
                </CardContent>
            </Card>

            <div ref={contentRef}>
                <Card className="print:border-none print:shadow-none">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">{selectedAccount?.name || "Client"} - Time Report</CardTitle>
                        <CardDescription>
                            {dateRange?.from ? dateRange.to ? `${format(dateRange.from, "PPP")} to ${format(dateRange.to, "PPP")}` : `On ${format(dateRange.from, "PPP")}` : "All time"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-48 flex items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin"/></div>
                        ) : selectedAccountId ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead className="text-right">Duration</TableHead>
                                        <TableHead className="text-right">Billable</TableHead>
                                        <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEntries.length > 0 ? filteredEntries.map(entry => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{format(entry.startTime, 'yyyy-MM-dd')}</TableCell>
                                            <TableCell>{entry.subject}</TableCell>
                                            <TableCell className="text-right font-mono">{formatTime(entry.duration)}</TableCell>
                                            <TableCell className="text-right font-mono">${((entry.duration / 3600) * entry.billableRate).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => setSelectedEntry(entry)}><BookOpen className="mr-2 h-4 w-4"/>Open / Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onSelect={() => setEntryToDelete(entry)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">No entries found for this period.</TableCell></TableRow>
                                    )}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={2} className="font-bold">Totals</TableCell>
                                        <TableCell className="text-right font-bold font-mono">{formatTime(totalDuration)}</TableCell>
                                        <TableCell className="text-right font-bold font-mono">${totalBillable.toFixed(2)}</TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        ) : (
                            <div className="h-48 flex items-center justify-center"><p className="text-muted-foreground">Please select a client to generate a report.</p></div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        <EventDetailsDialog 
            isOpen={!!selectedEntry}
            onOpenChange={() => setSelectedEntry(null)}
            entry={selectedEntry}
            onSave={handleSaveEntry}
        />
        <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action will permanently delete the log entry: "{entryToDelete?.subject}". This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
