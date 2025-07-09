
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FilePlus, FileText, ArrowRight, Banknote, ListOrdered, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
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
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { useToast } from "@/hooks/use-toast";

const FINALIZED_INVOICES_KEY = 'ogeemo-finalized-invoices';

interface FinalizedInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Outstanding' | 'Overdue';
}

export default function InvoicesHubPage() {
  const [invoices, setInvoices] = useState<FinalizedInvoice[]>([]);
  const [invoiceToDelete, setInvoiceToDelete] = useState<FinalizedInvoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedInvoicesRaw = localStorage.getItem(FINALIZED_INVOICES_KEY);
      if (savedInvoicesRaw) {
        setInvoices(JSON.parse(savedInvoicesRaw));
      }
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load invoices.',
      });
    }
  }, [toast]);
  
  const getStatusBadge = (status: FinalizedInvoice['status']) => {
    switch (status) {
        case 'Paid':
            return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Paid</Badge>;
        case 'Outstanding':
            return <Badge variant="outline" className="border-orange-400 text-orange-500">Outstanding</Badge>;
        case 'Overdue':
            return <Badge variant="destructive">Overdue</Badge>;
    }
  };

  const handleDeleteInvoice = () => {
    if (!invoiceToDelete) return;

    try {
      const updatedInvoices = invoices.filter(inv => inv.id !== invoiceToDelete.id);
      setInvoices(updatedInvoices);
      localStorage.setItem(FINALIZED_INVOICES_KEY, JSON.stringify(updatedInvoices));
      toast({
        title: "Invoice Deleted",
        description: `Invoice ${invoiceToDelete.invoiceNumber} has been removed.`,
      });
    } catch (error) {
        console.error("Failed to delete invoice:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the invoice.',
        });
    } finally {
        setInvoiceToDelete(null);
    }
  };


  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="Invoice Manager" />
        <header className="text-center mb-6">
            <h1 className="text-3xl font-bold font-headline text-primary">
            Invoice Manager
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
            Create, manage, and track client invoices from here.
            </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <FilePlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Create New Invoice</CardTitle>
                    <CardDescription>
                    Generate a new invoice from logged activities or manual entries.
                    </CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1" />
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                <Link href="/accounting/invoices/create">
                    Create Invoice
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                </Button>
            </div>
            </Card>
            
            <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Manage Templates</CardTitle>
                    <CardDescription>
                    Create and manage reusable templates for your invoices.
                    </CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1" />
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                <Link href="/accounting/invoices/templates">
                    Go to Templates
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                </Button>
            </div>
            </Card>

            <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Banknote className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Post Invoice Payments</CardTitle>
                    <CardDescription>
                    When an invoice is paid, record it here, and Ogeemo will also update the income ledger.
                    </CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1" />
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                <Link href="/accounting/invoices/payments">
                    Go to Posting Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                </Button>
            </div>
            </Card>
        </div>

        <div className="max-w-6xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <ListOrdered className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Existing Invoices</CardTitle>
                            <CardDescription>A list of all your finalized invoices.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="w-16 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length > 0 ? invoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{invoice.clientName}</TableCell>
                                        <TableCell>{invoice.dueDate}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {invoice.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(invoice.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">Open menu for invoice {invoice.invoiceNumber}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => toast({ title: "Feature coming soon!", description: "Opening invoices is not yet implemented." })}>
                                                        <Eye className="mr-2 h-4 w-4" /> Open
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => toast({ title: "Feature coming soon!", description: "Editing invoices is not yet implemented." })}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => setInvoiceToDelete(invoice)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No finalized invoices found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
            This action will permanently delete invoice {invoiceToDelete?.invoiceNumber}. This action cannot be undone.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
