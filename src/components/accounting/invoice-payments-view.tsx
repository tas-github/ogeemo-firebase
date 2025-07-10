
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, HandCoins, FileText } from 'lucide-react';
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { useToast } from '@/hooks/use-toast';
import { format as formatDate } from "date-fns";
import { addContact } from '@/services/contact-service';

const FINALIZED_INVOICES_KEY = 'ogeemo-finalized-invoices';
const INCOME_LEDGER_KEY = "accountingIncomeLedger";
const EDIT_INVOICE_ID_KEY = 'editInvoiceId';
const RECEIPT_DATA_KEY = 'ogeemo-receipt-data';
const CLIENT_ACCOUNTS_KEY = 'ogeemo-client-accounts';

export interface FinalizedInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  originalAmount: number;
  amountPaid: number;
  dueDate: string;
}

interface ClientAccount {
  id: string;
  name: string;
  createdAt: string;
}


// --- Client Account Service (Simulation) ---
// In a real app, this would be in its own service file and interact with a database.
const getClientAccount = (clientName: string): ClientAccount | null => {
    const accountsRaw = localStorage.getItem(CLIENT_ACCOUNTS_KEY);
    const accounts: ClientAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];
    return accounts.find(acc => acc.name.toLowerCase() === clientName.toLowerCase()) || null;
}

const createClientAccount = (clientName: string): ClientAccount => {
    const accountsRaw = localStorage.getItem(CLIENT_ACCOUNTS_KEY);
    const accounts: ClientAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];
    const newAccount: ClientAccount = {
        id: `acc_${Date.now()}`,
        name: clientName,
        createdAt: new Date().toISOString(),
    };
    const updatedAccounts = [...accounts, newAccount];
    localStorage.setItem(CLIENT_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
    return newAccount;
};

const ensureClientAccountExists = (clientName: string): ClientAccount => {
    let account = getClientAccount(clientName);
    if (!account) {
        account = createClientAccount(clientName);
    }
    return account;
};


export function InvoicePaymentsView() {
    const [invoices, setInvoices] = useState<FinalizedInvoice[]>([]);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [invoiceToPay, setInvoiceToPay] = useState<FinalizedInvoice | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
    const [invoiceToDelete, setInvoiceToDelete] = useState<FinalizedInvoice | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        try {
            const savedInvoicesRaw = localStorage.getItem(FINALIZED_INVOICES_KEY);
            const savedInvoices = savedInvoicesRaw ? JSON.parse(savedInvoicesRaw) : [];
            // Simple migration for old data structure
            const migratedInvoices = savedInvoices.map((inv: any) => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                clientName: inv.clientName,
                originalAmount: inv.originalAmount || inv.amount,
                amountPaid: inv.amountPaid || (inv.status === 'Paid' ? (inv.originalAmount || inv.amount) : 0),
                dueDate: inv.dueDate,
            }));
            setInvoices(migratedInvoices);
        } catch (error) {
            console.error("Failed to load invoice data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load invoice data.' });
        }
    }, [toast]);
    
    const updateInvoices = (updatedInvoices: FinalizedInvoice[]) => {
        setInvoices(updatedInvoices);
        localStorage.setItem(FINALIZED_INVOICES_KEY, JSON.stringify(updatedInvoices));
    };

    const handleOpenPaymentDialog = (invoice: FinalizedInvoice) => {
        setInvoiceToPay(invoice);
        const balanceDue = invoice.originalAmount - invoice.amountPaid;
        setPaymentAmount(balanceDue > 0 ? parseFloat(balanceDue.toFixed(2)) : '');
        setIsPaymentDialogOpen(true);
    };

    const handleConfirmPayment = () => {
        if (!invoiceToPay || paymentAmount === '' || Number(paymentAmount) <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid payment amount.' });
            return;
        }

        try {
            // Update invoice
            const updatedInvoices = invoices.map(inv => 
                inv.id === invoiceToPay.id ? { ...inv, amountPaid: inv.amountPaid + Number(paymentAmount) } : inv
            );
            updateInvoices(updatedInvoices);
            
            // Add to income ledger
            const incomeLedgerRaw = localStorage.getItem(INCOME_LEDGER_KEY);
            const incomeLedger = incomeLedgerRaw ? JSON.parse(incomeLedgerRaw) : [];
            const newIncomeTransaction = {
                id: `inc_pmt_${invoiceToPay.id}_${Date.now()}`,
                date: formatDate(new Date(), 'yyyy-MM-dd'),
                company: invoiceToPay.clientName,
                description: `Payment for Invoice #${invoiceToPay.invoiceNumber}`,
                amount: Number(paymentAmount),
                incomeType: "Invoice Payment",
                depositedTo: "Bank Account #1", // Defaulting for simplicity
                explanation: `Payment recorded on ${formatDate(new Date(), 'PP')}`,
                documentNumber: invoiceToPay.invoiceNumber,
                type: 'business',
            };
            const updatedLedger = [newIncomeTransaction, ...incomeLedger];
            localStorage.setItem(INCOME_LEDGER_KEY, JSON.stringify(updatedLedger));

            toast({ title: 'Payment Recorded', description: `Payment of ${Number(paymentAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} recorded.` });
            
            setIsPaymentDialogOpen(false);
            setInvoiceToPay(null);
            setPaymentAmount('');
        } catch (error) {
            console.error("Failed to record payment:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not record payment.' });
        }
    };
    
    const handleEditInvoice = (invoice: FinalizedInvoice) => {
        try {
            localStorage.setItem(EDIT_INVOICE_ID_KEY, invoice.id);
            router.push('/accounting/invoices/create');
        } catch (error) {
            console.error('Failed to set invoice for editing:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not prepare the invoice for editing.' });
        }
    };
    
    const handleDeleteInvoice = () => {
        if (!invoiceToDelete) return;
        const updatedInvoices = invoices.filter(inv => inv.id !== invoiceToDelete.id);
        updateInvoices(updatedInvoices);
        toast({ title: "Invoice Deleted", description: `Invoice ${invoiceToDelete.invoiceNumber} has been removed.` });
        setInvoiceToDelete(null);
    };

    const handleCreateReceipt = (invoice: FinalizedInvoice) => {
        // Ensure a client account exists before creating a receipt
        ensureClientAccountExists(invoice.clientName);

        const otherInvoices = invoices.filter(i => i.clientName === invoice.clientName && i.id !== invoice.id);
        const carryForwardAmount = otherInvoices.reduce((acc, curr) => {
            return acc + (curr.originalAmount - curr.amountPaid);
        }, 0);
        
        try {
            const receiptPayload = {
                invoice,
                carryForwardAmount
            };
            sessionStorage.setItem(RECEIPT_DATA_KEY, JSON.stringify(receiptPayload));
            router.push('/accounting/invoices/receipt');
        } catch (error) {
            console.error('Failed to set receipt data:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate the receipt.' });
        }
    };

    const getStatusInfo = (invoice: FinalizedInvoice): { status: string; badgeVariant: "secondary" | "destructive" | "outline" } => {
        const balanceDue = invoice.originalAmount - invoice.amountPaid;
        if (balanceDue <= 0.001) { // Use a small epsilon for float comparison
            return { status: "Paid", badgeVariant: "secondary" };
        }
        if (invoice.amountPaid > 0) {
            return { status: "Partially Paid", badgeVariant: "outline" };
        }
        if (new Date(invoice.dueDate) < new Date()) {
            return { status: "Overdue", badgeVariant: "destructive" };
        }
        return { status: "Outstanding", badgeVariant: "outline" };
    };

    return (
        <>
            <div className="p-4 sm:p-6 space-y-6">
                <AccountingPageHeader pageTitle="Accounts Receivable" />
                <header className="text-center">
                    <h1 className="text-3xl font-bold font-headline text-primary">Accounts Receivable</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Manage all outstanding invoices and payments due from clients.
                    </p>
                </header>

                <Card>
                    <CardHeader><CardTitle>Outstanding Invoices</CardTitle></CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">Original Amount</TableHead>
                                        <TableHead className="text-right">Amount Paid</TableHead>
                                        <TableHead className="text-right">Balance Due</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length > 0 ? invoices.map((invoice) => {
                                        const { status, badgeVariant } = getStatusInfo(invoice);
                                        const balanceDue = invoice.originalAmount - invoice.amountPaid;
                                        return (
                                            <TableRow key={invoice.id}>
                                                <TableCell>{invoice.invoiceNumber}</TableCell>
                                                <TableCell>{invoice.clientName}</TableCell>
                                                <TableCell>{invoice.dueDate}</TableCell>
                                                <TableCell className="text-right font-mono">{invoice.originalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                                <TableCell className="text-right font-mono text-green-600">{invoice.amountPaid.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                                <TableCell className="text-right font-mono">{balanceDue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                                <TableCell className="text-center"><Badge variant={badgeVariant} className={badgeVariant === 'secondary' ? 'bg-green-100 text-green-800' : ''}>{status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => handleOpenPaymentDialog(invoice)} disabled={status === 'Paid'}><HandCoins className="mr-2 h-4 w-4"/>Post Payment</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleCreateReceipt(invoice)} disabled={invoice.amountPaid <= 0}><FileText className="mr-2 h-4 w-4"/>Create Receipt</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleEditInvoice(invoice)}><Edit className="mr-2 h-4 w-4"/>Edit Invoice</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => setInvoiceToDelete(invoice)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete Invoice</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No invoices found.</TableCell></TableRow>
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
                        <DialogTitle>Post Payment for {invoiceToPay?.invoiceNumber}</DialogTitle>
                        <DialogDescription>Enter the amount received. This will be added to your income ledger.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="payment-amount">Payment Amount</Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                            <Input id="payment-amount" type="number" placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))} className="pl-7"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmPayment}>Post Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete invoice {invoiceToDelete?.invoiceNumber}.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
