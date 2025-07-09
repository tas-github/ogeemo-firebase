
"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvoicePageHeader } from "@/components/accounting/invoice-page-header";
import { cn } from '@/lib/utils';

// Define types and mock data
type MockInvoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Outstanding' | 'Overdue';
};

const mockInvoices: MockInvoice[] = [
  { id: 'inv-1', invoiceNumber: 'INV-2024-001', clientName: 'Client Alpha', amount: 5000, dueDate: '2024-08-24', status: 'Outstanding' },
  { id: 'inv-2', invoiceNumber: 'INV-2024-002', clientName: 'Client Beta', amount: 2500, dueDate: '2024-08-23', status: 'Outstanding' },
  { id: 'inv-3', invoiceNumber: 'INV-2023-156', clientName: 'Old Client LLC', amount: 1800, dueDate: '2024-06-15', status: 'Overdue' },
  { id: 'inv-4', invoiceNumber: 'INV-2023-155', clientName: 'E-commerce Store', amount: 850.75, dueDate: '2024-06-10', status: 'Paid' },
];

export function InvoicePaymentsView() {
    const getStatusBadge = (status: MockInvoice['status']) => {
        switch (status) {
            case 'Paid':
                return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Paid</Badge>;
            case 'Outstanding':
                return <Badge variant="outline" className="border-orange-400 text-orange-500">Outstanding</Badge>;
            case 'Overdue':
                return <Badge variant="destructive">Overdue</Badge>;
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <InvoicePageHeader pageTitle="Post Invoice Payments" />
            <header className="text-center">
                <h1 className="text-3xl font-bold font-headline text-primary">Post Invoice Payments</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    When an invoice is paid, record it here. Ogeemo will also update the income ledger.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>A list of all outstanding, paid, and overdue invoices.</CardDescription>
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
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockInvoices.map((invoice) => (
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
                                            {invoice.status !== 'Paid' && (
                                                <Button variant="outline" size="sm">Record Payment</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
