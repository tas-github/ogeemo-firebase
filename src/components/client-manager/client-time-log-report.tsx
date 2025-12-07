'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LoaderCircle, ChevronsUpDown, Check, Printer, Calendar as CalendarIcon, FileDigit } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { type DateRange } from "react-day-picker";
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from '@/hooks/use-react-to-print';
import { type Contact } from '@/data/contacts';
import { type Event as TaskEvent, type Project } from '@/types/calendar-types';
import { cn } from '@/lib/utils';
import { ReportsPageHeader } from '@/components/reports/page-header';
import { Checkbox } from '@/components/ui/checkbox';

const PRESELECTED_CONTACT_ID_KEY = 'ogeemo-preselected-contact-id';

const formatTime = (totalSeconds: number) => {
    if (!totalSeconds) return '0h 0m';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

const endOfDay = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
};

interface ClientTimeLogReportProps {
  initialContacts: Contact[];
  initialEntries: TaskEvent[];
  initialProjects: Project[];
}

export function ClientTimeLogReport({ initialContacts, initialEntries, initialProjects }: ClientTimeLogReportProps) {
    const [contacts] = useState<Contact[]>(initialContacts);
    const [allEntries] = useState<TaskEvent[]>(initialEntries);
    const [projects] = useState<Project[]>(initialProjects);
    const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isContactPopoverOpen, setIsContactPopoverOpen] = useState(false);
    
    const { toast } = useToast();
    const { handlePrint, contentRef } = useReactToPrint();
    const router = useRouter();

    const filteredEntries = useMemo(() => {
        if (!selectedContactId) return [];
        
        return allEntries
            .filter(entry => entry.contactId === selectedContactId && entry.isBillable && (entry.duration || 0) > 0)
            .filter(entry => {
                if (!dateRange || !dateRange.from || !entry.start) return true;
                const entryDate = new Date(entry.start);
                const toDate = dateRange.to || dateRange.from;
                return entryDate >= dateRange.from && entryDate <= endOfDay(toDate);
            });
    }, [selectedContactId, allEntries, dateRange]);
    
    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);

    const totalDuration = useMemo(() => filteredEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0), [filteredEntries]);
    const totalBillable = useMemo(() => filteredEntries.reduce((acc, entry) => acc + ((entry.duration || 0) / 3600) * (entry.billableRate || 0), 0), [filteredEntries]);
    
    const setMonthToDate = () => setDateRange({ from: startOfMonth(new Date()), to: new Date() });
    
    const handleToggleSelect = (entryId: string) => {
        setSelectedEntryIds(prev =>
            prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId]
        );
    };

    const handleToggleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked) {
            setSelectedEntryIds(filteredEntries.map(entry => entry.id));
        } else {
            setSelectedEntryIds([]);
        }
    };

    const handleCreateInvoice = () => {
        if (!selectedContactId) {
            toast({ variant: 'destructive', title: 'Client Not Selected', description: 'Please select a client before creating an invoice.'});
            return;
        }

        try {
            sessionStorage.setItem(PRESELECTED_CONTACT_ID_KEY, selectedContactId);
            router.push('/accounting/invoices/create');
        } catch (error) {
            console.error('Failed to prepare for invoice creation:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not navigate to the invoice generator.' });
        }
    };
    
    const selectedContact = contacts.find(c => c.id === selectedContactId);
    
    const allVisibleSelected = filteredEntries.length > 0 && selectedEntryIds.length === filteredEntries.length;
    const someVisibleSelected = selectedEntryIds.length > 0 && !allVisibleSelected;


    return (
        <div className="p-4 sm:p-6 space-y-6">
            <ReportsPageHeader pageTitle="Client Billing Report" />

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
                                    {selectedContact?.name || "Select client..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command><CommandInput placeholder="Search clients..." /><CommandList><CommandEmpty>No client found.</CommandEmpty><CommandGroup>{contacts.map(c => (<CommandItem key={c.id} value={c.name} onSelect={() => { setSelectedContactId(c.id); setIsContactPopoverOpen(false); }}> <Check className={cn("mr-2 h-4 w-4", selectedContactId === c.id ? "opacity-100" : "opacity-0")}/>{c.name}</CommandItem>))}</CommandGroup></CommandList></Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y") : <span>All Time</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/></PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button variant="secondary" onClick={setMonthToDate} className="w-full">Month to Date</Button>
                        <Button variant="ghost" onClick={() => setDateRange(undefined)} className="w-full">Clear Date</Button>
                    </div>
                </CardContent>
            </Card>

            <div ref={contentRef}>
                <Card className="print:border-none print:shadow-none">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">{selectedContact?.name || "Client"} - Time Report</CardTitle>
                        <CardDescription>
                            {dateRange?.from ? dateRange.to ? `${format(new Date(dateRange.from), "PPP")} to ${format(new Date(dateRange.to), "PPP")}` : `On ${format(new Date(dateRange.from), "PPP")}` : "All Time"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {selectedContactId ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"><Checkbox onCheckedChange={handleToggleSelectAll} checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false} /></TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Subject / Task</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead className="text-right">Duration</TableHead>
                                        <TableHead className="text-right">Billable Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEntries.length > 0 ? filteredEntries.map(entry => (
                                        <TableRow key={entry.id} data-state={selectedEntryIds.includes(entry.id) && "selected"}>
                                            <TableCell><Checkbox onCheckedChange={() => handleToggleSelect(entry.id)} checked={selectedEntryIds.includes(entry.id)}/></TableCell>
                                            <TableCell>{entry.start ? format(new Date(entry.start), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                                            <TableCell>{entry.title}</TableCell>
                                            <TableCell>{entry.projectId ? projectMap.get(entry.projectId) || 'N/A' : 'N/A'}</TableCell>
                                            <TableCell className="text-right font-mono">{formatTime(entry.duration || 0)}</TableCell>
                                            <TableCell className="text-right font-mono">${(((entry.duration || 0) / 3600) * (entry.billableRate || 0)).toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center">No billable time entries found for this client and period.</TableCell></TableRow>
                                    )}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={4} className="font-bold">Totals</TableCell>
                                        <TableCell className="text-right font-bold font-mono">{formatTime(totalDuration)}</TableCell>
                                        <TableCell className="text-right font-bold font-mono">${totalBillable.toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        ) : (
                            <div className="h-48 flex items-center justify-center"><p className="text-muted-foreground">Please select a client to generate a report.</p></div>
                        )}
                    </CardContent>
                    <CardFooter className="print:hidden justify-end space-x-2">
                       <Button onClick={handleCreateInvoice} disabled={!selectedContactId}>
                            <FileDigit className="mr-2 h-4 w-4" />
                            Create Invoice
                        </Button>
                        <Button variant="outline" onClick={handlePrint} disabled={!selectedContactId}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Report
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
