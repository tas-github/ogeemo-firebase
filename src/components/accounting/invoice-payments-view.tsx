
"use client";

import React, { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { InvoicePageHeader } from "@/components/accounting/invoice-page-header";
import { useToast } from '@/hooks/use-toast';
import { format as formatDate } from "date-fns";

// Define types and localStorage keys
const FINALIZED_INVOICES_KEY = 'ogeemo-finalized-invoices';
const INCOME_LEDGER_KEY = "accountingIncomeLedger";
const DEPOSIT_ACCOUNTS_KEY = "accountingDepositAccounts";

interface FinalizedInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Outstanding' | 'Overdue';
}

export function InvoicePaymentsView() {
    const [invoices, setInvoices] = useState<FinalizedInvoice[]>([]);
    const [depositAccounts, setDepositAccounts] = useState<string[]>([]);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [invoiceToPay, setInvoiceToPay] = useState<FinalizedInvoice | null>(null);
    const [paymentDate, setPaymentDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
    const [depositAccount, setDepositAccount] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedInvoicesRaw = localStorage.getItem(FINALIZED_INVOICES_KEY);
            const savedInvoices = savedInvoicesRaw ? JSON.parse(savedInvoicesRaw) : [];
            setInvoices(savedInvoices);

            const savedAccountsRaw = localStorage.getItem(DEPOSIT_ACCOUNTS_KEY);
            const savedAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : ["Bank Account #1", "Credit Card #1"];
            setDepositAccounts(savedAccounts);
            if (savedAccounts.length > 0) {
                setDepositAccount(savedAccounts[0]);
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load invoice or account data.' });
        }
    }, [toast]);

    const handleOpenPaymentDialog = (invoice: FinalizedInvoice) => {
        setInvoiceToPay(invoice);
        setPaymentDate(formatDate(new Date(), 'yyyy-MM-dd'));
        if (depositAccounts.length > 0) {
            setDepositAccount(depositAccounts[0]);
        }
        setIsPaymentDialogOpen(true);
    };

    const handleConfirmPayment = () => {
        if (!invoiceToPay || !paymentDate || !depositAccount) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide all payment details.' });
            return;
        }

        try {
            // Update invoice status
            const updatedInvoices = invoices.map(inv => 
                inv.id === invoiceToPay.id ? { ...inv, status: 'Paid' as const } : inv
            );
            localStorage.setItem(FINALIZED_INVOICES_KEY, JSON.stringify(updatedInvoices));
            setInvoices(updatedInvoices);

            // Add to income ledger
            const incomeLedgerRaw = localStorage.getItem(INCOME_LEDGER_KEY);
            const incomeLedger = incomeLedgerRaw ? JSON.parse(incomeLedgerRaw) : [];

            const newIncomeTransaction = {
                id: `inc_pmt_${invoiceToPay.id}`,
                date: paymentDate,
                company: invoiceToPay.clientName,
                description: `Payment for Invoice #${invoiceToPay.invoiceNumber}`,
                amount: invoiceToPay.amount,
                incomeType: "Invoice Payment",
                depositedTo: depositAccount,
                explanation: `Payment recorded on ${formatDate(new Date(), 'PP')}`,
                documentNumber: invoiceToPay.invoiceNumber,
                type: 'business',
            };

            const updatedLedger = [newIncomeTransaction, ...incomeLedger];
            localStorage.setItem(INCOME_LEDGER_KEY, JSON.stringify(updatedLedger));

            toast({
                title: 'Payment Recorded',
                description: `Payment for ${invoiceToPay.invoiceNumber} has been successfully recorded.`
            });
            
            setIsPaymentDialogOpen(false);
            setInvoiceToPay(null);

        } catch (error) {
            console.error("Failed to record payment:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not record payment.' });
        }
    };


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

    return (
        <>
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
                        <CardDescription>A list of all finalized invoices.</CardDescription>
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
                                                {invoice.status !== 'Paid' && (
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenPaymentDialog(invoice)}>Record Payment</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                No finalized invoices found. Create one from the Invoice Generator.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment for {invoiceToPay?.invoiceNumber}</DialogTitle>
                        <DialogDescription>Confirm the payment details. This will update the invoice status and add a transaction to your income ledger.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-date">Payment Date</Label>
                            <Input id="payment-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deposit-account">Deposit To</Label>
                            <Select value={depositAccount} onValueChange={setDepositAccount}>
                                <SelectTrigger id="deposit-account"><SelectValue placeholder="Select an account" /></SelectTrigger>
                                <SelectContent>
                                    {depositAccounts.map(acc => <SelectItem key={acc} value={acc}>{acc}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmPayment}>Confirm Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
