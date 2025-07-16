"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import { format } from "date-fns";

type TaxType = "Personal" | "Business" | "Corporate";
type PaymentType = "Federal" | "State" | "Local" | "Other";

interface TaxPayment {
  id: string;
  taxType: TaxType;
  paymentType: PaymentType;
  date: string;
  amount: number;
  notes: string;
}

const TAX_PAYMENTS_KEY = "accountingTaxPayments";

const initialPayments: TaxPayment[] = [
    { id: 'payment-1', taxType: 'Business', paymentType: 'Federal', date: '2024-04-15', amount: 4500, notes: 'Q1 Estimated Tax' },
    { id: 'payment-2', taxType: 'Business', paymentType: 'State', date: '2024-04-15', amount: 1200, notes: 'Q1 Estimated State Tax' },
    { id: 'payment-3', taxType: 'Personal', paymentType: 'Federal', date: '2024-06-15', amount: 5000, notes: 'Q2 Estimated Tax' },
];

const emptyPaymentForm = {
    taxType: "Business" as TaxType,
    paymentType: "Federal" as PaymentType,
    date: '',
    amount: '',
    notes: '',
};

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const TaxPaymentsTable = ({ payments, onEdit, onDelete }: { payments: TaxPayment[], onEdit: (payment: TaxPayment) => void, onDelete: (payment: TaxPayment) => void }) => {
    const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

    return (
        <div>
            <div className="text-right mb-4">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalPaid)}</p>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.length > 0 ? payments.map(payment => (
                        <TableRow key={payment.id}>
                            <TableCell>{payment.date}</TableCell>
                            <TableCell>{payment.paymentType}</TableCell>
                            <TableCell>{payment.notes}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => onEdit(payment)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(payment)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">No payments recorded for this category.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};


export function TaxView() {
    const [allPayments, setAllPayments] = useState<TaxPayment[]>([]);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState<TaxPayment | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<TaxPayment | null>(null);
    const [newPayment, setNewPayment] = useState(emptyPaymentForm);
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
            setNewPayment({ ...payment, amount: String(payment.amount) });
        } else {
            setPaymentToEdit(null);
            setNewPayment(emptyPaymentForm);
        }
        setIsPaymentDialogOpen(true);
    };

    const handleSavePayment = () => {
        const amountNum = parseFloat(newPayment.amount);
        if (!newPayment.date || !newPayment.amount || isNaN(amountNum) || amountNum <= 0) {
            toast({ variant: 'destructive', title: "Invalid Input", description: "Date and a valid amount are required." });
            return;
        }

        const paymentData = {
            ...newPayment,
            amount: amountNum,
        };

        if (paymentToEdit) {
            updatePayments(allPayments.map(p => p.id === paymentToEdit.id ? { ...p, ...paymentData } : p));
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
            <Tabs defaultValue="Business">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="Business">Business</TabsTrigger>
                <TabsTrigger value="Personal">Personal</TabsTrigger>
                <TabsTrigger value="Corporate">Corporate</TabsTrigger>
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
            </Tabs>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{paymentToEdit ? 'Edit Payment' : 'Add New Payment'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="taxType">Tax Category</Label>
                <Select value={newPayment.taxType} onValueChange={(v) => setNewPayment(p => ({...p, taxType: v as TaxType}))}>
                    <SelectTrigger id="taxType"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="date">Payment Date</Label>
                <Input id="date" type="date" value={newPayment.date} onChange={(e) => setNewPayment(p => ({...p, date: e.target.value}))}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select value={newPayment.paymentType} onValueChange={(v) => setNewPayment(p => ({...p, paymentType: v as PaymentType}))}>
                        <SelectTrigger id="paymentType"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Federal">Federal</SelectItem>
                            <SelectItem value="State">Prov/State</SelectItem>
                            <SelectItem value="Local">Local</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" placeholder="0.00" value={newPayment.amount} onChange={(e) => setNewPayment(p => ({...p, amount: e.target.value}))}/>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" placeholder="e.g., Q2 Estimated Payment" value={newPayment.notes} onChange={(e) => setNewPayment(p => ({...p, notes: e.target.value}))}/>
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
