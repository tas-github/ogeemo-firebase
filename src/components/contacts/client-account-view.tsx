
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoaderCircle, ArrowLeft, Mail, Phone, Briefcase, FileDigit, Clock, User, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getContactById, type Contact } from '@/services/contact-service';
import { getProjects, type Project } from '@/services/project-service';
import { getTasksForUser, type Event as TaskEvent } from '@/services/project-service';
import { format } from 'date-fns';
import { formatTime } from '@/lib/utils';
import { Badge } from '../ui/badge';
import Link from 'next/link';

interface ClientAccountViewProps {
    contactId: string;
}

const INVOICE_FROM_REPORT_KEY = 'invoiceFromReportData';


export function ClientAccountView({ contactId }: ClientAccountViewProps) {
    const [contact, setContact] = useState<Contact | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<TaskEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const loadData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [contactData, allProjects, allTasks] = await Promise.all([
                getContactById(contactId),
                getProjects(user.uid),
                getTasksForUser(user.uid)
            ]);
            
            if (!contactData) {
                toast({ variant: 'destructive', title: 'Error', description: 'Contact not found.' });
                router.push('/contacts');
                return;
            }

            setContact(contactData);
            setProjects(allProjects.filter(p => p.contactId === contactId));
            setTasks(allTasks.filter(t => t.contactId === contactId && t.status === 'done'));

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [contactId, user, toast, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const totalBillableAmount = useMemo(() => {
        return tasks
            .filter(t => t.isBillable && t.duration && t.billableRate)
            .reduce((acc, task) => acc + (task.duration! / 3600) * task.billableRate!, 0);
    }, [tasks]);

    const handleGenerateInvoice = () => {
        if (!contact || tasks.length === 0) {
            toast({ variant: 'destructive', title: 'Cannot Create Invoice', description: 'No billable work items found for this client.'});
            return;
        }

        const lineItems = tasks
            .filter(entry => entry.isBillable && (entry.duration || 0) > 0 && (entry.billableRate || 0) > 0)
            .map(entry => {
                const hours = (entry.duration || 0) / 3600;
                return {
                    description: `${entry.title} - ${format(entry.start!, 'PPP')}`,
                    quantity: parseFloat(hours.toFixed(2)),
                    price: entry.billableRate,
                };
            });
        
        if (lineItems.length === 0) {
            toast({ variant: 'destructive', title: 'No Billable Items', description: 'There are no billable time entries in the log of work.'});
            return;
        }
        
        try {
            const invoiceData = { contactId: contact.id, lineItems: lineItems };
            sessionStorage.setItem(INVOICE_FROM_REPORT_KEY, JSON.stringify(invoiceData));
            router.push('/accounting/invoices/create');
        } catch (error) {
             console.error('Failed to prepare invoice data:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not prepare the invoice data for generation.' });
        }
    };

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    
    if (!contact) {
        return null;
    }
    
    const primaryPhoneNumber = contact.primaryPhoneType && contact[contact.primaryPhoneType] ? contact[contact.primaryPhoneType] : contact.cellPhone || contact.businessPhone || contact.homePhone;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary">{contact.name}</h1>
                    <p className="text-muted-foreground">Client Account Hub</p>
                </div>
                <Button asChild>
                    <Link href="/contacts">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Contacts
                    </Link>
                </Button>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground"/><a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a></div>
                            {primaryPhoneNumber && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground"/><a href={`tel:${primaryPhoneNumber}`} className="hover:underline">{primaryPhoneNumber}</a></div>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Projects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {projects.length > 0 ? (
                                <ul className="space-y-2">
                                    {projects.map(p => (
                                        <li key={p.id}>
                                            <Link href={`/projects/${p.id}/tasks`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4 text-primary" />
                                                    <span className="font-medium text-sm">{p.name}</span>
                                                </div>
                                                <Badge variant="outline">{p.status}</Badge>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No projects assigned to this client.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader className="flex-row justify-between items-center">
                            <CardTitle>Log of Work Done</CardTitle>
                            <Button onClick={handleGenerateInvoice}>
                                <FileDigit className="mr-2 h-4 w-4" /> Generate Invoice
                            </Button>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Task</TableHead>
                                        <TableHead className="text-right">Time Logged</TableHead>
                                        <TableHead className="text-right">Billable</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.length > 0 ? tasks.map(task => {
                                        const billableAmount = task.isBillable && task.duration && task.billableRate ? (task.duration / 3600) * task.billableRate : 0;
                                        return (
                                            <TableRow key={task.id}>
                                                <TableCell>{format(task.start!, 'PP')}</TableCell>
                                                <TableCell>{task.title}</TableCell>
                                                <TableCell className="text-right font-mono">{formatTime(task.duration || 0)}</TableCell>
                                                <TableCell className="text-right font-mono">{billableAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No completed work found for this client.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                <CardFooter>
                                    <div className="flex justify-end w-full pt-4">
                                        <div className="text-right">
                                            <p className="text-muted-foreground">Total Billable Amount</p>
                                            <p className="text-2xl font-bold">{totalBillableAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Table>
                        </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    );
}
