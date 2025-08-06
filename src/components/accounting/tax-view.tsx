
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";

type TaxType = "Personal" | "Business" | "Corporate" | "Sales Tax";
type PaymentType = "Federal" | "Provincial" | "Local" | "Other";
type SalesTaxType = "GST" | "HST" | "VAT" | "PST" | "Tariff" | "Other";

interface TaxPayment {
  id: string;
  taxType: TaxType;
  paymentType: PaymentType;
  salesTaxType?: SalesTaxType;
  date: string;
  amount: number;
  notes: string;
  openingBalance: number;
  paidFrom: string;
}

const TAX_PAYMENTS_KEY = "accountingTaxPayments";

const initialPayments: TaxPayment[] = [
    { id: 'payment-1', taxType: 'Business', paymentType: 'Federal', date: '2024-04-15', amount: 4500, notes: 'Q1 Estimated Tax', openingBalance: 10000, paidFrom: 'Main Checking' },
    { id: 'payment-2', taxType: 'Business', paymentType: 'Provincial', date: '2024-04-15', amount: 1200, notes: 'Q1 Estimated Provincial Tax', openingBalance: 2500, paidFrom: 'Main Checking' },
    { id: 'payment-3', taxType: 'Personal', paymentType: 'Federal', date: '2024-06-15', amount: 5000, notes: 'Q2 Estimated Tax', openingBalance: 15000, paidFrom: 'Personal Savings' },
    { id: 'remittance-1', taxType: 'Sales Tax', paymentType: 'Federal', salesTaxType: 'GST', date: '2024-07-31', amount: 850, notes: 'Q2 GST/HST Remittance', openingBalance: 850, paidFrom: 'Main Checking' },
];

const emptyPaymentForm = {
    taxType: "Business" as TaxType,
    paymentType: "Federal" as PaymentType,
    salesTaxType: "GST" as SalesTaxType,
    date: '',
    amount: '',
    notes: '',
    openingBalance: '',
    paidFrom: '',
};

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Mock list of bank accounts. In a real app, this would come from a service.
const availableBankAccounts = ["Main Checking", "Business Savings", "Personal Savings", "Stripe Balance"];

const TaxPaymentsTable = ({ payments, onEdit, onDelete }: { payments: TaxPayment[], onEdit: (payment: TaxPayment) => void, onDelete: (payment: TaxPayment) => void }) => {
    const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

    return (
        <div>
            <div className="text-right mb-4">
                <p className="text-sm text-muted-foreground">Total Paid / Remitted</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalPaid)}</p>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Opening Balance</TableHead>
                        <TableHead className="text-right">Amount Paid</TableHead>
                        <TableHead className="text-right">Balance Owing</TableHead>
                        <TableHead>Paid From</TableHead>
                        <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.length > 0 ? payments.map(payment => {
                        const balanceOwing = payment.openingBalance - payment.amount;
                        return (
                            <TableRow key={payment.id}>
                                <TableCell>{payment.date}</TableCell>
                                <TableCell>{payment.notes}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(payment.openingBalance)}</TableCell>
                                <TableCell className="text-right font-mono text-green-600">({formatCurrency(payment.amount)})</TableCell>
                                <TableCell className="text-right font-mono font-semibold">{formatCurrency(balanceOwing)}</TableCell>
                                <TableCell>{payment.paidFrom}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(payment)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(payment)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </TableCell>
                            </TableRow>
                        );
                    }) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">No payments recorded for this category.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

const SalesTaxView = ({ payments, onEdit, onDelete, onRecordRemittance }: { payments: TaxPayment[], onEdit: (payment: TaxPayment) => void, onDelete: (payment: TaxPayment) => void, onRecordRemittance: (amount: number) => void }) => {
    // In a real application, these values would be calculated from income and expense ledgers.
    const taxCollected = 2250.75;
    const itcsPaid = 1400.25;
    const netTax = taxCollected - itcsPaid;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tax Collected (Sales)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(taxCollected)}</div>
                        <p className="text-xs text-muted-foreground">From sales in the current period.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ITCs (Expenses)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(itcsPaid)}</div>
                        <p className="text-xs text-muted-foreground">Tax paid on business expenses.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Tax Owing</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(netTax)}</div>
                        <p className="text-xs text-muted-foreground">Tax Collected - ITCs Paid.</p>
                    </CardContent>
                     <CardFooter>
                         <Button size="sm" className="w-full" onClick={() => onRecordRemittance(netTax)}>Record Remittance</Button>
                     </CardFooter>
                </Card>
            </div>
            <Separator />
            <div>
                <h3 className="text-lg font-semibold mb-2">Remittance History</h3>
                <TaxPaymentsTable payments={payments} onEdit={onEdit} onDelete={onDelete} />
            </div>
        </div>
    );
};


export function TaxView() {
    const [allPayments, setAllPayments] = useState<TaxPayment[]>([]);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState<TaxPayment | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<TaxPayment | null>(null);
    const [newPayment, setNewPayment] = useState(emptyPaymentForm);
    const [activeTab, setActiveTab] = useState<TaxType>("Business");
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedData = localStorage.getItem(TAX_PAYMENTS_KEY);
            setAllPayments(savedData ? JSON.parse(savedData) : initialPayments);
        } catch (e) {
            console.error("Failed to load tax payments from localStorage", e);
            setAllPayments(initialPayments);
        }
    }, []);

    const updatePayments = (updatedPayments: TaxPayment[]) => {
        setAllPayments(updatedPayments);
        localStorage.setItem(TAX_PAYMENTS_KEY, JSON.stringify(updatedPayments));
    }

    const handleOpenDialog = (payment?: TaxPayment) => {
        if (payment) {
            setPaymentToEdit(payment);
            setNewPayment({ ...payment, amount: String(payment.amount), openingBalance: String(payment.openingBalance), salesTaxType: payment.salesTaxType || 'GST' });
        } else {
            setPaymentToEdit(null);
            setNewPayment({...emptyPaymentForm, taxType: activeTab});
        }
        setIsPaymentDialogOpen(true);
    };

    const handleOpenRemittanceDialog = (amount: number) => {
        setPaymentToEdit(null);
        setNewPayment({
            ...emptyPaymentForm,
            taxType: 'Sales Tax',
            openingBalance: String(amount.toFixed(2)),
            amount: String(amount.toFixed(2)),
            notes: 'Sales Tax Remittance',
        });
        setIsPaymentDialogOpen(true);
    };

    const handleSavePayment = () => {
        const amountNum = parseFloat(newPayment.amount);
        const openingBalanceNum = parseFloat(newPayment.openingBalance);

        if (!newPayment.date || !newPayment.amount || isNaN(amountNum) || amountNum <= 0 || !newPayment.openingBalance || isNaN(openingBalanceNum) || openingBalanceNum < 0 || !newPayment.paidFrom) {
            toast({ variant: "destructive", title: "Invalid Input", description: "All fields marked with * are required." });
            return;
        }

        const paymentData: Omit<TaxPayment, 'id'> = {
            taxType: newPayment.taxType,
            paymentType: newPayment.paymentType,
            salesTaxType: newPayment.taxType === 'Sales Tax' ? newPayment.salesTaxType : undefined,
            date: newPayment.date,
            amount: amountNum,
            notes: newPayment.notes,
            openingBalance: openingBalanceNum,
            paidFrom: newPayment.paidFrom,
        };

        if (paymentToEdit) {
            updatePayments(allPayments.map(p => p.id === paymentToEdit.id ? { ...paymentToEdit, ...paymentData } : p));
            toast({ title: "Payment Updated" });
        } else {
            const newEntry: TaxPayment = { id: `payment_${Date.now()}`, ...paymentData };
            updatePayments([newEntry, ...allPayments]);
            toast({ title: "Payment Added" });
        }
        setIsPaymentDialogOpen(false);
    }
    
    const handleConfirmDelete = () => {
        if (!paymentToDelete) return;
        updatePayments(allPayments.filter(p => p.id !== paymentToDelete.id));
        toast({ title: "Payment Deleted", variant: "destructive" });
        setPaymentToDelete(null);
    }
    
    const balanceOwing = useMemo(() => {
        const opening = parseFloat(newPayment.openingBalance);
        const amount = parseFloat(newPayment.amount);
        if (isNaN(opening) || isNaN(amount)) return 0;
        return opening - amount;
    }, [newPayment.openingBalance, newPayment.amount]);

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="Tax Account" />
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Tax Account Manager
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track tax payments for personal, business, and corporate entities.
          </p>
        </header>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Tax Payments</CardTitle>
                <CardDescription>
                  A record of all estimated and paid taxes.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Payment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="Business" onValueChange={(value) => setActiveTab(value as TaxType)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="Business">Business</TabsTrigger>
                <TabsTrigger value="Personal">Personal</TabsTrigger>
                <TabsTrigger value="Corporate">Corporate</TabsTrigger>
                <TabsTrigger value="Sales Tax">Sales Tax</TabsTrigger>
              </TabsList>
              <TabsContent value="Business" className="mt-4">
                <TaxPaymentsTable payments={allPayments.filter(p => p.taxType === 'Business')} onEdit={handleOpenDialog} onDelete={setPaymentToDelete} />
              </TabsContent>
              <TabsContent value="Personal" className="mt-4">
                <TaxPaymentsTable payments={allPayments.filter(p => p.taxType === 'Personal')} onEdit={handleOpenDialog} onDelete={setPaymentToDelete} />
              </TabsContent>
              <TabsContent value="Corporate" className="mt-4">
                <TaxPaymentsTable payments={allPayments.filter(p => p.taxType === 'Corporate')} onEdit={handleOpenDialog} onDelete={setPaymentToDelete} />
              </TabsContent>
               <TabsContent value="Sales Tax" className="mt-4">
                <SalesTaxView payments={allPayments.filter(p => p.taxType === 'Sales Tax')} onEdit={handleOpenDialog} onDelete={setPaymentToDelete} onRecordRemittance={handleOpenRemittanceDialog} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{paymentToEdit ? 'Edit Payment' : (activeTab === 'Sales Tax' ? 'Record Remittance' : 'Add New Payment')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="taxType">Tax Category</Label>
                <Select value={newPayment.taxType} onValueChange={(v) => setNewPayment(p => ({...p, taxType: v as TaxType}))}>
                    <SelectTrigger id="taxType"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                        <SelectItem value="Sales Tax">Sales Tax (GST, VAT, etc.)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {newPayment.taxType === 'Sales Tax' && (
              <div className="space-y-2">
                <Label htmlFor="salesTaxType">Specific Sales Tax</Label>
                <Select value={newPayment.salesTaxType} onValueChange={(v) => setNewPayment(p => ({...p, salesTaxType: v as SalesTaxType}))}>
                    <SelectTrigger id="salesTaxType"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="GST">GST</SelectItem>
                        <SelectItem value="HST">HST</SelectItem>
                        <SelectItem value="VAT">VAT</SelectItem>
                        <SelectItem value="PST">PST</SelectItem>
                        <SelectItem value="Tariff">Tariff</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="date">Payment Date <span className="text-destructive">*</span></Label>
                <Input id="date" type="date" value={newPayment.date} onChange={(e) => setNewPayment(p => ({...p, date: e.target.value}))}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="openingBalance">Opening Balance <span className="text-destructive">*</span></Label>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                        <Input id="openingBalance" type="number" placeholder="0.00" value={newPayment.openingBalance} onChange={(e) => setNewPayment(p => ({...p, openingBalance: e.target.value}))} className="pl-7"/>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount Paid <span className="text-destructive">*</span></Label>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                        <Input id="amount" type="number" placeholder="0.00" value={newPayment.amount} onChange={(e) => setNewPayment(p => ({...p, amount: e.target.value}))} className="pl-7"/>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Balance Owing</Label>
                <Input value={formatCurrency(balanceOwing)} readOnly disabled className="font-mono" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select value={newPayment.paymentType} onValueChange={(v) => setNewPayment(p => ({...p, paymentType: v as PaymentType}))}>
                        <SelectTrigger id="paymentType"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Federal">Federal</SelectItem>
                            <SelectItem value="Provincial">Provincial</SelectItem>
                            <SelectItem value="Local">Local</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paidFrom">Paid From <span className="text-destructive">*</span></Label>
                    <Select value={newPayment.paidFrom} onValueChange={(v) => setNewPayment(p => ({...p, paidFrom: v}))}>
                        <SelectTrigger id="paidFrom"><SelectValue placeholder="Select account..."/></SelectTrigger>
                        <SelectContent>
                            {availableBankAccounts.map(acc => <SelectItem key={acc} value={acc}>{acc}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="e.g., Q2 Estimated Payment" value={newPayment.notes} onChange={(e) => setNewPayment(p => ({...p, notes: e.target.value}))}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePayment}>{paymentToEdit ? 'Save Changes' : 'Add Payment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this tax payment record.</AlertDialogDescription>
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
