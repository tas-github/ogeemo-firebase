
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, FileText, Filter, ChevronsUpDown, Check, Calendar as CalendarIcon, X, Info, FileDigit, Clock, UserCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjects, getTasksForUser } from '@/services/project-service';
import { getContacts } from '@/services/contact-service';
import { type Project, type Event as TaskEvent } from '@/types/calendar';
import { type Contact } from '@/data/contacts';
import { format } from 'date-fns';
import { ReportsPageHeader } from './page-header';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Calendar } from '../ui/calendar';
import { type DateRange } from "react-day-picker";
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import Link from 'next/link';

const formatTime = (totalSeconds: number) => {
    if (!totalSeconds) return '0h 0m';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const endOfDay = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
};


export function BillableHoursReport() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<TaskEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [fetchedProjects, fetchedContacts, fetchedTasks] = await Promise.all([
          getProjects(user.uid),
          getContacts(user.uid),
          getTasksForUser(user.uid),
        ]);
        setProjects(fetchedProjects);
        setContacts(fetchedContacts);
        setTasks(fetchedTasks);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load report data', description: error.message });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, toast]);

  const billableTasks = useMemo(() => {
    return tasks
      .filter(task => {
          if (!task.isBillable || (task.duration || 0) <= 0) return false;
          if (selectedContactIds.length > 0 && !selectedContactIds.includes(task.contactId || '')) return false;
          if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(task.projectId || '')) return false;
          if (dateRange?.from) {
              const taskDate = task.start ? new Date(task.start) : new Date();
              const toDate = dateRange.to || dateRange.from;
              return taskDate >= dateRange.from && taskDate <= endOfDay(toDate);
          }
          return true;
      })
      .sort((a, b) => new Date(b.start || 0).getTime() - new Date(a.start || 0).getTime());
  }, [tasks, dateRange, selectedContactIds, selectedProjectIds]);

  const { totalDuration, totalAmount } = useMemo(() => {
    let duration = 0;
    let amount = 0;
    billableTasks.forEach(task => {
      duration += task.duration || 0;
      amount += ((task.duration || 0) / 3600) * (task.billableRate || 0);
    });
    return { totalDuration: duration, totalAmount: amount };
  }, [billableTasks]);

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);
  const contactMap = useMemo(() => new Map(contacts.map(c => [c.id, c.name])), [contacts]);
  
  const clearFilters = () => {
    setDateRange(undefined);
    setSelectedContactIds([]);
    setSelectedProjectIds([]);
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <ReportsPageHeader pageTitle="Billable Hours Report" />
        <header className="text-center">
            <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-bold font-headline text-primary">Billable Hours Report</h1>
                <Button variant="ghost" size="icon" onClick={() => setIsInfoDialogOpen(true)}>
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">About this report</span>
                </Button>
            </div>
          <p className="text-muted-foreground">A comprehensive overview of all billable time across your projects.</p>
        </header>

         <div className="flex items-center justify-end gap-2">
            <Button variant="outline" asChild>
                <Link href="/reports/client-billing">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Client Billing Report
                </Link>
            </Button>
            <Button asChild>
                <Link href="/reports">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports Hub
                </Link>
            </Button>
        </div>


        <Card>
            <CardHeader>
                <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Date range</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                    </PopoverContent>
                </Popover>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                           <span className="truncate">
                                {selectedContactIds.length > 0 ? `${selectedContactIds.length} client(s) selected` : "Filter by client..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command><CommandInput placeholder="Search clients..." /><CommandList><CommandEmpty>No client found.</CommandEmpty><CommandGroup>{contacts.map(c => (<CommandItem key={c.id} onSelect={() => setSelectedContactIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}> <Check className={cn("mr-2 h-4 w-4", selectedContactIds.includes(c.id) ? "opacity-100" : "opacity-0")}/>{c.name}</CommandItem>))}</CommandGroup></CommandList></Command>
                    </PopoverContent>
                </Popover>
                
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                            <span className="truncate">
                               {selectedProjectIds.length > 0 ? `${selectedProjectIds.length} project(s) selected` : "Filter by project..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command><CommandInput placeholder="Search projects..." /><CommandList><CommandEmpty>No project found.</CommandEmpty><CommandGroup>{projects.map(p => (<CommandItem key={p.id} onSelect={() => setSelectedProjectIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}> <Check className={cn("mr-2 h-4 w-4", selectedProjectIds.includes(p.id) ? "opacity-100" : "opacity-0")}/>{p.name}</CommandItem>))}</CommandGroup></CommandList></Command>
                    </PopoverContent>
                </Popover>
                
                <Button onClick={clearFilters} variant="ghost"><X className="mr-2 h-4 w-4"/> Clear Filters</Button>
            </CardContent>
        </Card>
      
        <Card>
            <CardHeader>
                <CardTitle>Report Results</CardTitle>
                <CardDescription>This report shows all tasks that are marked as billable and have time logged against them within the filtered range.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Duration</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {billableTasks.length > 0 ? billableTasks.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell>{task.start ? format(new Date(task.start), 'PPP') : 'N/A'}</TableCell>
                                    <TableCell>{task.title}</TableCell>
                                    <TableCell>{task.projectId ? projectMap.get(task.projectId) || 'N/A' : 'N/A'}</TableCell>
                                    <TableCell>{task.contactId ? contactMap.get(task.contactId) || 'N/A' : 'N/A'}</TableCell>
                                    <TableCell className="text-right font-mono">{formatTime(task.duration || 0)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(((task.duration || 0) / 3600) * (task.billableRate || 0))}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No billable time entries found for the selected filters.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4} className="font-bold">Totals</TableCell>
                                <TableCell className="text-right font-bold font-mono">{formatTime(totalDuration)}</TableCell>
                                <TableCell className="text-right font-bold font-mono">{formatCurrency(totalAmount)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                )}
            </CardContent>
        </Card>
      </div>

      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>About the Billable Hours Report</DialogTitle>
                <DialogDescription>
                    This report is a powerful tool to understand where your billable time is going. Here's how to use it.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                 <div className="flex items-start gap-4">
                    <Clock className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">What it Shows</h4>
                        <p className="text-sm text-muted-foreground">This report gathers every task that is marked as "billable" and has had time logged against it in the Task & Event Manager. It calculates the dollar amount for each entry based on the duration and the hourly rate you set.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Filter className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">How to Filter</h4>
                        <p className="text-sm text-muted-foreground">Use the filters at the top to narrow your results. You can select a date range, one or more clients, and one or more projects to see exactly the data you need.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <FileDigit className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">Creating Invoices</h4>
                        <p className="text-sm text-muted-foreground">While this report provides a great overview, the primary tool for invoicing is the **Client Billing Report**. Navigate there to generate a report for a specific client and create an invoice directly from the billable entries.</p>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsInfoDialogOpen(false)}>Got it</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
