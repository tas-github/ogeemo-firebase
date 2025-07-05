"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Pencil, Trash2, BookOpen } from "lucide-react";
import { TransactionsPageHeader } from "@/components/accounting/transactions-page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialIncomeData = [
  { id: "inc_1", date: "2024-07-25", source: "Client Alpha", company: "Alpha Inc.", description: "Web Development Services", amount: 5000, category: "Service Revenue", explanation: "Contracted services" },
  { id: "inc_2", date: "2024-07-24", source: "Client Beta", company: "Beta Corp.", description: "Consulting Retainer - July", amount: 2500, category: "Consulting", explanation: "Monthly retainer" },
  { id: "inc_3", date: "2024-07-22", source: "E-commerce Store", company: "Ogeemo Store", description: "Product Sales", amount: 850.75, category: "Sales Revenue", explanation: "Online sales" },
  { id: "inc_4", date: "2024-07-20", source: "Affiliate Payout", company: "PartnerStack", description: "Q2 Affiliate Earnings", amount: 320.50, category: "Other Income", explanation: "Referral commissions" },
];

type IncomeTransaction = typeof initialIncomeData[0];
const INCOME_CATEGORIES_KEY = "accountingIncomeCategories";
const defaultIncomeCategories = ["Service Revenue", "Consulting", "Sales Revenue", "Other Income"];
const emptyTransactionForm = { date: '', party: '', company: '', description: '', amount: '', category: '', explanation: '' };


export function IncomeView() {
  const [incomeLedger, setIncomeLedger] = React.useState(initialIncomeData);
  const [incomeCategories, setIncomeCategories] = React.useState<string[]>([]);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = React.useState(false);
  const [transactionToEdit, setTransactionToEdit] = React.useState<IncomeTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = React.useState<IncomeTransaction | null>(null);
  const [newTransaction, setNewTransaction] = React.useState(emptyTransactionForm);
  
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const savedIncome = localStorage.getItem(INCOME_CATEGORIES_KEY);
      setIncomeCategories(savedIncome ? JSON.parse(savedIncome) : defaultIncomeCategories);
    } catch (error) {
        console.error("Failed to load categories from localStorage", error);
        setIncomeCategories(defaultIncomeCategories);
    }
  }, []);
  
  const handleOpenTransactionDialog = (transaction?: IncomeTransaction) => {
    if (transaction) {
        setTransactionToEdit(transaction);
        setNewTransaction({
            date: transaction.date,
            party: transaction.source,
            company: transaction.company || '',
            description: transaction.description,
            amount: String(transaction.amount),
            category: transaction.category,
            explanation: transaction.explanation || '',
        });
    } else {
        setTransactionToEdit(null);
        setNewTransaction(emptyTransactionForm);
    }
    setIsTransactionDialogOpen(true);
  };

  const handleSaveTransaction = () => {
    const amountNum = parseFloat(newTransaction.amount);
    if (!newTransaction.date || !newTransaction.party || !newTransaction.category || !newTransaction.amount || isNaN(amountNum) || amountNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill all required fields correctly.' });
        return;
    }

    const transactionData = {
        date: newTransaction.date,
        description: newTransaction.description.trim(),
        amount: amountNum,
        category: newTransaction.category,
        company: newTransaction.company.trim(),
        explanation: newTransaction.explanation.trim(),
        source: newTransaction.party.trim(),
    };

    if (transactionToEdit) { // Handle editing existing transaction
        setIncomeLedger(prev => prev.map(item => item.id === transactionToEdit.id ? { ...item, ...transactionData } : item));
        toast({ title: "Income Transaction Updated" });
    } else { // Handle adding new transaction
        const newEntry: IncomeTransaction = { id: `inc_${Date.now()}`, ...transactionData };
        setIncomeLedger(prev => [newEntry, ...prev]);
        toast({ title: "Income Transaction Added" });
    }

    setIsTransactionDialogOpen(false);
    setTransactionToEdit(null);
    setNewTransaction(emptyTransactionForm);
  };
  
  const handleConfirmDelete = () => {
    if (!transactionToDelete) return;
    setIncomeLedger(prev => prev.filter(item => item.id !== transactionToDelete.id));
    toast({ title: 'Transaction Deleted' });
    setTransactionToDelete(null);
  };
  
  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <TransactionsPageHeader pageTitle="Manage Income" />
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Income
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Review and manage all incoming revenue.
          </p>
        </header>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Income Transactions</CardTitle>
              <CardDescription>A list of all recorded income.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => handleOpenTransactionDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Income
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeLedger.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.source}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </TableCell>
                    <TableCell>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleOpenTransactionDialog(item)}><BookOpen className="mr-2 h-4 w-4"/>Open</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleOpenTransactionDialog(item)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => setTransactionToDelete(item)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transactionToEdit ? 'Edit Income' : 'Add Income'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-date" className="text-right">Date</Label>
              <Input id="tx-date" type="date" value={newTransaction.date} onChange={(e) => setNewTransaction(prev => ({...prev, date: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-party" className="text-right">Source</Label>
              <Input id="tx-party" value={newTransaction.party} onChange={(e) => setNewTransaction(prev => ({...prev, party: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-company" className="text-right">Company</Label>
              <Input id="tx-company" value={newTransaction.company} onChange={(e) => setNewTransaction(prev => ({...prev, company: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-description" className="text-right">Description</Label>
              <Input id="tx-description" value={newTransaction.description} onChange={(e) => setNewTransaction(prev => ({...prev, description: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-amount" className="text-right">Amount</Label>
              <Input id="tx-amount" type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction(prev => ({...prev, amount: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-category" className="text-right">Category</Label>
              <Select value={newTransaction.category} onValueChange={(value) => setNewTransaction(prev => ({...prev, category: value}))}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {incomeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-explanation" className="text-right">Explanation</Label>
              <Input id="tx-explanation" value={newTransaction.explanation} onChange={(e) => setNewTransaction(prev => ({...prev, explanation: e.target.value}))} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsTransactionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTransaction}>{transactionToEdit ? 'Save Changes' : 'Save Income'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the transaction: "{transactionToDelete?.description}".
            </AlertDialogDescription>
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
