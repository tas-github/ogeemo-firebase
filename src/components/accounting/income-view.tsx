
"use client";

import React from "react";
import Link from "next/link";
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
import { PlusCircle, MoreVertical, Pencil, Trash2, BookOpen, Settings, Plus, TrendingDown, LoaderCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/auth-context";
import { getIncomeTransactions, addIncomeTransaction, updateIncomeTransaction, deleteIncomeTransaction, type IncomeTransaction } from "@/services/accounting-service";

const emptyTransactionForm = { date: '', company: '', description: '', amount: '', incomeType: '', depositedTo: '', explanation: '', documentNumber: '', type: 'business' as 'business' | 'personal' };

// TODO: These should be moved to a settings service
const defaultIncomeTypes = ["Service Revenue", "Consulting", "Sales Revenue", "Other Income", "Invoice Payment"];
const defaultCompanies = ["Client Alpha", "Client Beta", "E-commerce Store", "Affiliate Payout"];
const defaultDepositAccounts = ["Bank Account #1", "Credit Card #1", "Cash Account"];

export function IncomeView() {
  const [incomeLedger, setIncomeLedger] = React.useState<IncomeTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
  
  const [incomeTypes, setIncomeTypes] = React.useState<string[]>(defaultIncomeTypes);
  const [companies, setCompanies] = React.useState<string[]>(defaultCompanies);
  const [depositAccounts, setDepositAccounts] = React.useState<string[]>(defaultDepositAccounts);
  
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = React.useState(false);
  const [transactionToEdit, setTransactionToEdit] = React.useState<IncomeTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = React.useState<IncomeTransaction | null>(null);
  
  const [newTransaction, setNewTransaction] = React.useState(emptyTransactionForm);
  const [newIncomeType, setNewIncomeType] = React.useState("");

  const { toast } = useToast();

  React.useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const loadData = async () => {
        setIsLoading(true);
        try {
            const transactions = await getIncomeTransactions(user.uid);
            setIncomeLedger(transactions);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to load income data", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, [user, toast]);
  

  const handleOpenTransactionDialog = (transaction?: IncomeTransaction) => {
    if (transaction) {
        setTransactionToEdit(transaction);
        setNewTransaction({
            date: transaction.date,
            company: transaction.company,
            description: transaction.description,
            amount: String(transaction.amount),
            incomeType: transaction.incomeType,
            depositedTo: transaction.depositedTo,
            explanation: transaction.explanation || '',
            documentNumber: transaction.documentNumber || '',
            type: transaction.type || 'business',
        });
    } else {
        setTransactionToEdit(null);
        setNewTransaction(emptyTransactionForm);
    }
    setIsTransactionDialogOpen(true);
  };

  const handleSaveTransaction = async () => {
    if (!user) return;
    const amountNum = parseFloat(newTransaction.amount);
    if (!newTransaction.date || !newTransaction.company || !newTransaction.incomeType || !newTransaction.amount || isNaN(amountNum) || amountNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill all required fields correctly.' });
        return;
    }

    const transactionData = {
        date: newTransaction.date,
        company: newTransaction.company,
        description: newTransaction.description.trim(),
        amount: amountNum,
        incomeType: newTransaction.incomeType,
        depositedTo: newTransaction.depositedTo,
        explanation: newTransaction.explanation.trim(),
        documentNumber: newTransaction.documentNumber.trim(),
        type: newTransaction.type,
    };

    try {
        if (transactionToEdit) {
            await updateIncomeTransaction(transactionToEdit.id, transactionData);
            setIncomeLedger(prev => prev.map(item => item.id === transactionToEdit.id ? { ...item, ...transactionData } : item));
            toast({ title: "Income Transaction Updated" });
        } else {
            const newEntry = await addIncomeTransaction({ ...transactionData, userId: user.uid });
            setIncomeLedger(prev => [newEntry, ...prev]);
            toast({ title: "Income Transaction Added" });
        }
        setIsTransactionDialogOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
        await deleteIncomeTransaction(transactionToDelete.id);
        setIncomeLedger(prev => prev.filter(item => item.id !== transactionToDelete.id));
        toast({ title: 'Transaction Deleted' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } finally {
        setTransactionToDelete(null);
    }
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
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <Link href="/accounting/transactions/expenses">
                        <TrendingDown className="mr-2 h-4 w-4" /> Go to Expenses
                    </Link>
                </Button>
                <Button variant="outline" onClick={() => handleOpenTransactionDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Income
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Income Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {incomeLedger.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.company}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.incomeType}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl text-primary">{transactionToEdit ? 'Edit Income' : 'Add Income'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-date" className="text-right">Date <span className="text-destructive">*</span></Label>
              <Input id="tx-date" type="date" value={newTransaction.date} onChange={(e) => setNewTransaction(prev => ({...prev, date: e.target.value}))} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-company" className="text-right">Company <span className="text-destructive">*</span></Label>
              <div className="col-span-3 flex items-center gap-2">
                  <Select value={newTransaction.company} onValueChange={(value) => setNewTransaction(prev => ({...prev, company: value}))}>
                    <SelectTrigger id="tx-company" className="w-full"><SelectValue placeholder="Select or add a company" /></SelectTrigger>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-doc-number" className="text-right">Document #</Label>
              <Input id="tx-doc-number" value={newTransaction.documentNumber} onChange={(e) => setNewTransaction(prev => ({...prev, documentNumber: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-description" className="text-right">Description</Label>
              <Input id="tx-description" value={newTransaction.description} onChange={(e) => setNewTransaction(prev => ({...prev, description: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-amount" className="text-right">Amount <span className="text-destructive">*</span></Label>
              <div className="relative col-span-3">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                  <Input
                      id="tx-amount"
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({...prev, amount: e.target.value}))}
                      className="pl-7"
                      step="0.01"
                      placeholder="0.00"
                  />
              </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-deposit-account" className="text-right">Deposited To</Label>
              <div className="col-span-3 flex items-center gap-2">
                  <Select value={newTransaction.depositedTo} onValueChange={(value) => setNewTransaction(prev => ({...prev, depositedTo: value}))}>
                    <SelectTrigger id="tx-deposit-account" className="w-full"><SelectValue placeholder="Select an account" /></SelectTrigger>
                    <SelectContent>
                      {depositAccounts.map(acc => <SelectItem key={acc} value={acc}>{acc}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-income-type" className="text-right">Income Type <span className="text-destructive">*</span></Label>
              <div className="col-span-3 flex items-center gap-2">
                <Select value={newTransaction.incomeType} onValueChange={(value) => setNewTransaction(prev => ({...prev, incomeType: value}))}>
                  <SelectTrigger id="tx-income-type" className="w-full"><SelectValue placeholder="Select a type" /></SelectTrigger>
                  <SelectContent>
                    {incomeTypes.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-explanation" className="text-right">Explanation</Label>
              <Input id="tx-explanation" value={newTransaction.explanation} onChange={(e) => setNewTransaction(prev => ({...prev, explanation: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tx-type" className="text-right">Type</Label>
                <RadioGroup
                    value={newTransaction.type}
                    onValueChange={(value: 'business' | 'personal') => setNewTransaction(prev => ({ ...prev, type: value }))}
                    className="col-span-3 flex items-center space-x-4"
                    id="tx-type"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="business" id="type-business-inc" />
                        <Label htmlFor="type-business-inc">Business</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="personal" id="type-personal-inc" />
                        <Label htmlFor="type-personal-inc">Personal</Label>
                    </div>
                </RadioGroup>
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
