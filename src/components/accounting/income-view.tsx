
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
import { PlusCircle, MoreVertical, Pencil, Trash2, BookOpen, Settings, Plus, TrendingDown } from "lucide-react";
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

// Mock data
const initialIncomeData = [
  { id: "inc_1", date: "2024-07-25", incomeType: "Client Alpha", company: "Alpha Inc.", description: "Web Development Services", amount: 5000, category: "Service Revenue", depositedTo: "Bank Account #1", explanation: "Contracted services", documentNumber: "INV-2024-001", type: "business" as "business" | "personal" },
  { id: "inc_2", date: "2024-07-24", incomeType: "Client Beta", company: "Beta Corp.", description: "Consulting Retainer - July", amount: 2500, category: "Consulting", depositedTo: "Bank Account #1", explanation: "Monthly retainer", documentNumber: "INV-2024-002", type: "business" as "business" | "personal" },
  { id: "inc_3", date: "2024-07-22", incomeType: "E-commerce Store", company: "Ogeemo Store", description: "Product Sales", amount: 850.75, category: "Sales Revenue", depositedTo: "Credit Card #1", explanation: "Online sales", documentNumber: "SALE-9876", type: "business" as "business" | "personal" },
  { id: "inc_4", date: "2024-07-20", incomeType: "Affiliate Payout", company: "PartnerStack", description: "Q2 Affiliate Earnings", amount: 320.50, category: "Other Income", depositedTo: "Cash Account", explanation: "Referral commissions", documentNumber: "PS-PAY-Q2", type: "business" as "business" | "personal" },
];

type IncomeTransaction = typeof initialIncomeData[0];
const INCOME_CATEGORIES_KEY = "accountingIncomeCategories";
const EXPENSE_CATEGORIES_KEY = "accountingExpenseCategories";
const INCOME_TYPES_KEY = "accountingIncomeTypes";
const DEPOSIT_ACCOUNTS_KEY = "accountingDepositAccounts";

const defaultIncomeCategories = ["Service Revenue", "Consulting", "Sales Revenue", "Other Income"];
const defaultExpenseCategories = ["Utilities", "Software", "Office Supplies", "Contractors", "Marketing", "Travel", "Meals"];
const defaultIncomeTypes = ["Client Alpha", "Client Beta", "E-commerce Store", "Affiliate Payout"];
const defaultDepositAccounts = ["Bank Account #1", "Credit Card #1", "Cash Account"];

const emptyTransactionForm = { date: '', incomeType: '', company: '', description: '', amount: '', category: '', depositedTo: '', explanation: '', documentNumber: '', type: 'business' as 'business' | 'personal' };


export function IncomeView() {
  const [incomeLedger, setIncomeLedger] = React.useState(initialIncomeData);
  const [incomeCategories, setIncomeCategories] = React.useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = React.useState<string[]>([]);
  const [incomeTypes, setIncomeTypes] = React.useState<string[]>([]);
  const [depositAccounts, setDepositAccounts] = React.useState<string[]>([]);
  
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = React.useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [isIncomeTypeDialogOpen, setIsIncomeTypeDialogOpen] = React.useState(false);
  const [isDepositAccountDialogOpen, setIsDepositAccountDialogOpen] = React.useState(false);

  const [transactionToEdit, setTransactionToEdit] = React.useState<IncomeTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = React.useState<IncomeTransaction | null>(null);
  
  const [newTransaction, setNewTransaction] = React.useState(emptyTransactionForm);
  const [newIncomeCategory, setNewIncomeCategory] = React.useState("");
  const [newExpenseCategory, setNewExpenseCategory] = React.useState("");
  const [newIncomeType, setNewIncomeType] = React.useState("");
  const [newDepositAccount, setNewDepositAccount] = React.useState("");
  const [editingIncomeType, setEditingIncomeType] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState("");
  
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const savedIncomeCat = localStorage.getItem(INCOME_CATEGORIES_KEY);
      setIncomeCategories(savedIncomeCat ? JSON.parse(savedIncomeCat) : defaultIncomeCategories);
      
      const savedExpenseCat = localStorage.getItem(EXPENSE_CATEGORIES_KEY);
      setExpenseCategories(savedExpenseCat ? JSON.parse(savedExpenseCat) : defaultExpenseCategories);

      const savedIncomeTypes = localStorage.getItem(INCOME_TYPES_KEY);
      setIncomeTypes(savedIncomeTypes ? JSON.parse(savedIncomeTypes) : defaultIncomeTypes);
      
      const savedDepositAccounts = localStorage.getItem(DEPOSIT_ACCOUNTS_KEY);
      setDepositAccounts(savedDepositAccounts ? JSON.parse(savedDepositAccounts) : defaultDepositAccounts);

    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setIncomeCategories(defaultIncomeCategories);
        setExpenseCategories(defaultExpenseCategories);
        setIncomeTypes(defaultIncomeTypes);
        setDepositAccounts(defaultDepositAccounts);
    }
  }, []);
  
  const handleOpenTransactionDialog = (transaction?: IncomeTransaction) => {
    if (transaction) {
        setTransactionToEdit(transaction);
        setNewTransaction({
            date: transaction.date,
            incomeType: transaction.incomeType,
            company: transaction.company || '',
            description: transaction.description,
            amount: String(transaction.amount),
            category: transaction.category,
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

  const handleSaveTransaction = () => {
    const amountNum = parseFloat(newTransaction.amount);
    if (!newTransaction.date || !newTransaction.incomeType || !newTransaction.category || !newTransaction.amount || isNaN(amountNum) || amountNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill all required fields correctly.' });
        return;
    }

    const transactionData = {
        date: newTransaction.date,
        incomeType: newTransaction.incomeType,
        description: newTransaction.description.trim(),
        amount: amountNum,
        category: newTransaction.category,
        depositedTo: newTransaction.depositedTo,
        company: newTransaction.company.trim(),
        explanation: newTransaction.explanation.trim(),
        documentNumber: newTransaction.documentNumber.trim(),
        type: newTransaction.type,
    };

    if (transactionToEdit) {
        setIncomeLedger(prev => prev.map(item => item.id === transactionToEdit.id ? { ...item, ...transactionData } : item));
        toast({ title: "Income Transaction Updated" });
    } else {
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

  const handleAddCategory = (type: 'income' | 'expense') => {
    if (type === 'income') {
        const categoryToAdd = newIncomeCategory.trim();
        if (!categoryToAdd) { toast({ variant: 'destructive', title: 'Category name cannot be empty.' }); return; }
        if (incomeCategories.map(c => c.toLowerCase()).includes(categoryToAdd.toLowerCase())) { toast({ variant: 'destructive', title: 'Duplicate Category', description: 'This category already exists.' }); return; }
        const updated = [...incomeCategories, categoryToAdd];
        setIncomeCategories(updated);
        localStorage.setItem(INCOME_CATEGORIES_KEY, JSON.stringify(updated));
        setNewIncomeCategory("");
    } else {
        const categoryToAdd = newExpenseCategory.trim();
        if (!categoryToAdd) { toast({ variant: 'destructive', title: 'Category name cannot be empty.' }); return; }
        if (expenseCategories.map(c => c.toLowerCase()).includes(categoryToAdd.toLowerCase())) { toast({ variant: 'destructive', title: 'Duplicate Category', description: 'This category already exists.' }); return; }
        const updated = [...expenseCategories, categoryToAdd];
        setExpenseCategories(updated);
        localStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(updated));
        setNewExpenseCategory("");
    }
  };
  
  const handleDeleteCategory = (category: string, type: 'income' | 'expense') => {
     if (type === 'income') {
        if (incomeLedger.some(item => item.category === category)) { toast({ variant: 'destructive', title: 'Cannot Delete', description: 'This category is currently in use.' }); return; }
        const updated = incomeCategories.filter(c => c !== category);
        setIncomeCategories(updated);
        localStorage.setItem(INCOME_CATEGORIES_KEY, JSON.stringify(updated));
     } else {
        const updated = expenseCategories.filter(c => c !== category);
        setExpenseCategories(updated);
        localStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(updated));
     }
  };

  const handleAddIncomeType = () => {
    const typeToAdd = newIncomeType.trim();
    if (!typeToAdd) { toast({ variant: 'destructive', title: 'Income type name cannot be empty.' }); return; }
    if (incomeTypes.map(c => c.toLowerCase()).includes(typeToAdd.toLowerCase())) { toast({ variant: 'destructive', title: 'Duplicate Type', description: 'This income type already exists.' }); return; }
    const updated = [...incomeTypes, typeToAdd];
    setIncomeTypes(updated);
    localStorage.setItem(INCOME_TYPES_KEY, JSON.stringify(updated));
    setNewIncomeType("");
  };

  const handleDeleteIncomeType = (typeToDelete: string) => {
    if (incomeLedger.some(item => item.incomeType === typeToDelete)) { toast({ variant: 'destructive', title: 'Cannot Delete', description: 'This income type is currently in use.' }); return; }
    const updated = incomeTypes.filter(c => c !== typeToDelete);
    setIncomeTypes(updated);
    localStorage.setItem(INCOME_TYPES_KEY, JSON.stringify(updated));
    toast({ title: 'Income Type Deleted' });
  };
  
  const handleEditIncomeType = (type: string) => {
    setEditingIncomeType(type);
    setEditingValue(type);
  };

  const handleCancelEdit = () => {
      setEditingIncomeType(null);
      setEditingValue("");
  };

  const handleUpdateIncomeType = () => {
      if (!editingIncomeType || !editingValue.trim() || editingIncomeType === editingValue.trim()) {
          handleCancelEdit();
          return;
      }

      const trimmedValue = editingValue.trim();
      if (incomeTypes.map(c => c.toLowerCase()).includes(trimmedValue.toLowerCase())) {
          toast({ variant: 'destructive', title: 'Duplicate Type', description: 'This income type already exists.' });
          return;
      }

      const updatedTypes = incomeTypes.map(t => t === editingIncomeType ? trimmedValue : t);
      setIncomeTypes(updatedTypes);
      localStorage.setItem(INCOME_TYPES_KEY, JSON.stringify(updatedTypes));

      setIncomeLedger(prev => prev.map(item => item.incomeType === editingIncomeType ? { ...item, incomeType: trimmedValue } : item));

      if (newTransaction.incomeType === editingIncomeType) {
          setNewTransaction(prev => ({...prev, incomeType: trimmedValue }));
      }

      toast({ title: 'Income Type Updated' });
      handleCancelEdit();
  };
  
  const handleAddDepositAccount = () => {
    const accountToAdd = newDepositAccount.trim();
    if (!accountToAdd) { toast({ variant: 'destructive', title: 'Account name cannot be empty.' }); return; }
    if (depositAccounts.map(c => c.toLowerCase()).includes(accountToAdd.toLowerCase())) { toast({ variant: 'destructive', title: 'Duplicate Account', description: 'This account already exists.' }); return; }
    const updated = [...depositAccounts, accountToAdd];
    setDepositAccounts(updated);
    localStorage.setItem(DEPOSIT_ACCOUNTS_KEY, JSON.stringify(updated));
    setNewDepositAccount("");
  };

  const handleDeleteDepositAccount = (accountToDelete: string) => {
    if (incomeLedger.some(item => item.depositedTo === accountToDelete)) { toast({ variant: 'destructive', title: 'Cannot Delete', description: 'This account is currently in use.' }); return; }
    const updated = depositAccounts.filter(c => c !== accountToDelete);
    setDepositAccounts(updated);
    localStorage.setItem(DEPOSIT_ACCOUNTS_KEY, JSON.stringify(updated));
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
                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" /> Manage Categories
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Income Type</TableHead>
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
                    <TableCell>{item.incomeType}</TableCell>
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
              <Label htmlFor="tx-date" className="text-right">Date <span className="text-destructive">*</span></Label>
              <Input id="tx-date" type="date" value={newTransaction.date} onChange={(e) => setNewTransaction(prev => ({...prev, date: e.target.value}))} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-income-type" className="text-right">Income Type <span className="text-destructive">*</span></Label>
              <div className="col-span-3 flex items-center gap-2">
                  <Select value={newTransaction.incomeType} onValueChange={(value) => setNewTransaction(prev => ({...prev, incomeType: value}))}>
                    <SelectTrigger id="tx-income-type" className="w-full"><SelectValue placeholder="Select a type" /></SelectTrigger>
                    <SelectContent>
                      {incomeTypes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="outline" onClick={() => setIsIncomeTypeDialogOpen(true)} className="flex-shrink-0">
                      <Settings className="h-4 w-4"/>
                      <span className="sr-only">Manage Income Types</span>
                  </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-company" className="text-right">Company</Label>
              <Input id="tx-company" value={newTransaction.company} onChange={(e) => setNewTransaction(prev => ({...prev, company: e.target.value}))} className="col-span-3" />
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
                  <Button type="button" size="icon" variant="outline" onClick={() => setIsDepositAccountDialogOpen(true)} className="flex-shrink-0">
                      <Settings className="h-4 w-4"/>
                      <span className="sr-only">Manage Accounts</span>
                  </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-category" className="text-right">Category <span className="text-destructive">*</span></Label>
              <div className="col-span-3 flex items-center gap-2">
                <Select value={newTransaction.category} onValueChange={(value) => setNewTransaction(prev => ({...prev, category: value}))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" onClick={() => setIsCategoryDialogOpen(true)} className="flex-shrink-0">
                    <Settings className="h-4 w-4"/>
                    <span className="sr-only">Manage Categories</span>
                </Button>
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

       <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Manage Categories</DialogTitle>
                  <DialogDescription>Add, edit, or delete your income and expense categories.</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="income-cat" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="income-cat">Income Categories</TabsTrigger>
                      <TabsTrigger value="expense-cat">Expense Categories</TabsTrigger>
                  </TabsList>
                  <TabsContent value="income-cat">
                      <div className="space-y-4 py-4">
                          <div className="flex gap-2">
                              <Input value={newIncomeCategory} onChange={(e) => setNewIncomeCategory(e.target.value)} placeholder="New income category" onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory('income'); }}/>
                              <Button onClick={() => handleAddCategory('income')}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                          </div>
                          <div className="space-y-2 rounded-md border p-2 h-48 overflow-y-auto">
                              {incomeCategories.map(cat => (
                                  <div key={cat} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                      <span>{cat}</span>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCategory(cat, 'income')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </TabsContent>
                  <TabsContent value="expense-cat">
                      <div className="space-y-4 py-4">
                          <div className="flex gap-2">
                              <Input value={newExpenseCategory} onChange={(e) => setNewExpenseCategory(e.target.value)} placeholder="New expense category" onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory('expense'); }}/>
                              <Button onClick={() => handleAddCategory('expense')}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                          </div>
                          <div className="space-y-2 rounded-md border p-2 h-48 overflow-y-auto">
                              {expenseCategories.map(cat => (
                                  <div key={cat} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                      <span>{cat}</span>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCategory(cat, 'expense')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </TabsContent>
              </Tabs>
              <DialogFooter>
                  <Button onClick={() => setIsCategoryDialogOpen(false)}>Done</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isIncomeTypeDialogOpen} onOpenChange={setIsIncomeTypeDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage Income Types</DialogTitle>
                <DialogDescription>Add, edit, or remove income types from your list.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex gap-2">
                    <Input value={newIncomeType} onChange={(e) => setNewIncomeType(e.target.value)} placeholder="New income type" onKeyDown={(e) => { if (e.key === 'Enter') handleAddIncomeType(); }}/>
                    <Button onClick={handleAddIncomeType}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                </div>
                <div className="space-y-2 rounded-md border p-2 h-48 overflow-y-auto">
                    {incomeTypes.map(c => (
                        <div key={c} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            {editingIncomeType === c ? (
                              <Input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={handleUpdateIncomeType}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateIncomeType();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                                className="h-8"
                              />
                            ) : (
                              <>
                                <span>{c}</span>
                                <div className="flex items-center">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditIncomeType(c)}><Pencil className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteIncomeType(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                              </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsIncomeTypeDialogOpen(false)}>Done</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDepositAccountDialogOpen} onOpenChange={setIsDepositAccountDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage Deposit Accounts</DialogTitle>
                <DialogDescription>Add or remove accounts from your list.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex gap-2">
                    <Input value={newDepositAccount} onChange={(e) => setNewDepositAccount(e.target.value)} placeholder="New account name" onKeyDown={(e) => { if (e.key === 'Enter') handleAddDepositAccount(); }}/>
                    <Button onClick={handleAddDepositAccount}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                </div>
                <div className="space-y-2 rounded-md border p-2 h-48 overflow-y-auto">
                    {depositAccounts.map(c => (
                        <div key={c} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            <span>{c}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteDepositAccount(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsDepositAccountDialogOpen(false)}>Done</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
