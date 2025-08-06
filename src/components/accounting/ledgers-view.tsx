
"use client";

import * as React from "react";
import { useSearchParams } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MoreVertical, BookOpen, Pencil, Trash2, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/auth-context";
import { getIncomeTransactions, addIncomeTransaction, updateIncomeTransaction, deleteIncomeTransaction, type IncomeTransaction, getExpenseTransactions, addExpenseTransaction, updateExpenseTransaction, deleteExpenseTransaction, type ExpenseTransaction } from "@/services/accounting-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


type GeneralTransaction = (IncomeTransaction | ExpenseTransaction) & { transactionType: 'income' | 'expense' };

const defaultIncomeTypes = ["Service Revenue", "Consulting", "Sales Revenue", "Other Income", "Invoice Payment"];
const defaultExpenseCategories = ["Utilities", "Software", "Office Supplies", "Contractors", "Marketing", "Travel", "Meals"];
const defaultCompanies = ["Client Alpha", "Client Beta", "E-commerce Store", "Affiliate Payout", "Cloud Hosting Inc.", "SaaS Tools Co.", "Office Supply Hub", "Jane Designs"];
const defaultDepositAccounts = ["Bank Account #1", "Credit Card #1", "Cash Account"];

const emptyTransactionForm = { date: '', company: '', description: '', amount: '', category: '', incomeType: '', explanation: '', documentNumber: '', type: 'business' as 'business' | 'personal', depositedTo: '' };

export function LedgersView() {
  const [incomeLedger, setIncomeLedger] = React.useState<IncomeTransaction[]>([]);
  const [expenseLedger, setExpenseLedger] = React.useState<ExpenseTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
  
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = React.useState(false);
  const [transactionToEdit, setTransactionToEdit] = React.useState<GeneralTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = React.useState<GeneralTransaction | null>(null);
  const [newTransactionType, setNewTransactionType] = React.useState<'income' | 'expense'>('income');
  const [newTransaction, setNewTransaction] = React.useState(emptyTransactionForm);

  const [showTotals, setShowTotals] = React.useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'general';

  React.useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [income, expenses] = await Promise.all([
                getIncomeTransactions(user.uid),
                getExpenseTransactions(user.uid),
            ]);
            setIncomeLedger(income);
            setExpenseLedger(expenses);
        } catch (error: any) {
             toast({ variant: "destructive", title: "Failed to load ledger data", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, [user, toast]);
  

  const generalLedger = React.useMemo(() => {
    const combined: GeneralTransaction[] = [
      ...incomeLedger.map(item => ({ ...item, transactionType: 'income' as const })),
      ...expenseLedger.map(item => ({ ...item, transactionType: 'expense' as const })),
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomeLedger, expenseLedger]);

  const incomeTotal = React.useMemo(() => incomeLedger.reduce((sum, item) => sum + item.amount, 0), [incomeLedger]);
  const expenseTotal = React.useMemo(() => expenseLedger.reduce((sum, item) => sum + item.amount, 0), [expenseLedger]);

  
    const handleOpenTransactionDialog = (type: 'income' | 'expense', transaction?: GeneralTransaction) => {
        setNewTransactionType(type);
        if (transaction) {
            setTransactionToEdit(transaction);
            setNewTransaction({
                date: transaction.date,
                company: transaction.company,
                description: transaction.description,
                amount: String(transaction.amount),
                category: (transaction as ExpenseTransaction).category || '',
                incomeType: (transaction as IncomeTransaction).incomeType || '',
                explanation: transaction.explanation || '',
                documentNumber: transaction.documentNumber || '',
                type: transaction.type || 'business',
                depositedTo: (transaction as IncomeTransaction).depositedTo || '',
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
        if (!newTransaction.date || !newTransaction.company || (newTransactionType === 'income' ? !newTransaction.incomeType : !newTransaction.category) || !newTransaction.amount || isNaN(amountNum) || amountNum <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill all required fields correctly.' });
            return;
        }

        try {
            if (transactionToEdit) {
                 if (transactionToEdit.transactionType === 'income') {
                    const updatedData = { date: newTransaction.date, company: newTransaction.company, description: newTransaction.description, amount: amountNum, incomeType: newTransaction.incomeType, depositedTo: newTransaction.depositedTo, explanation: newTransaction.explanation, documentNumber: newTransaction.documentNumber, type: newTransaction.type };
                    await updateIncomeTransaction(transactionToEdit.id, updatedData);
                    setIncomeLedger(prev => prev.map(item => item.id === transactionToEdit.id ? { ...item, ...updatedData } : item));
                    toast({ title: "Income Transaction Updated" });
                } else {
                    const updatedData = { date: newTransaction.date, company: newTransaction.company, description: newTransaction.description, amount: amountNum, category: newTransaction.category, explanation: newTransaction.explanation, documentNumber: newTransaction.documentNumber, type: newTransaction.type };
                    await updateExpenseTransaction(transactionToEdit.id, updatedData);
                    setExpenseLedger(prev => prev.map(item => item.id === transactionToEdit.id ? { ...item, ...updatedData } : item));
                    toast({ title: "Expense Transaction Updated" });
                }
            } else {
                 if (newTransactionType === 'income') {
                    const newEntryData: Omit<IncomeTransaction, 'id'> = { date: newTransaction.date, company: newTransaction.company, description: newTransaction.description, amount: amountNum, incomeType: newTransaction.incomeType, depositedTo: newTransaction.depositedTo, explanation: newTransaction.explanation, documentNumber: newTransaction.documentNumber, type: newTransaction.type, userId: user.uid };
                    const newEntry = await addIncomeTransaction(newEntryData);
                    setIncomeLedger(prev => [newEntry, ...prev]);
                    toast({ title: "Income Transaction Added" });
                } else {
                    const newEntryData: Omit<ExpenseTransaction, 'id'> = { date: newTransaction.date, company: newTransaction.company, description: newTransaction.description, amount: amountNum, category: newTransaction.category, explanation: newTransaction.explanation, documentNumber: newTransaction.documentNumber, type: newTransaction.type, userId: user.uid };
                    const newEntry = await addExpenseTransaction(newEntryData);
                    setExpenseLedger(prev => [newEntry, ...prev]);
                    toast({ title: "Expense Transaction Added" });
                }
            }
            setIsTransactionDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!transactionToDelete) return;
        try {
            if (transactionToDelete.transactionType === 'income') {
                await deleteIncomeTransaction(transactionToDelete.id);
                setIncomeLedger(prev => prev.filter(item => item.id !== transactionToDelete.id));
            } else {
                await deleteExpenseTransaction(transactionToDelete.id);
                setExpenseLedger(prev => prev.filter(item => item.id !== transactionToDelete.id));
            }
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
        <AccountingPageHeader pageTitle="BKS" hubPath="/accounting/bks" />
        <div className="flex flex-col">
          <header className="text-center mb-6 w-full mx-auto">
            <h1 className="text-3xl font-bold font-headline text-primary">BKS</h1>
            <p className="text-muted-foreground">A unified view of your income and expenses.</p>
          </header>

            <Tabs defaultValue={initialTab} className="w-full">
              <div className="flex justify-center items-center mb-4">
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                  <TabsTrigger value="general">General Ledger</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="general">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>General Ledger (All Transactions)</CardTitle>
                      <CardDescription>A combined view of all income and expense transactions.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => handleOpenTransactionDialog('income')}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Post Transaction
                        </Button>
                        <Button variant="outline" onClick={() => setShowTotals(!showTotals)}>Totals</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showTotals && (
                      <div className="mb-4 rounded-lg border bg-muted/50 p-3">
                        <div className="w-full max-w-xs space-y-1 text-right ml-auto">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total Income:</span><span className="font-mono font-medium text-green-600">{incomeTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total Expenses:</span><span className="font-mono font-medium text-red-600">({expenseTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })})</span></div>
                          <Separator className="my-1" />
                          <div className="flex justify-between text-sm font-semibold"><span>Net Position:</span><span className="font-mono">{(incomeTotal - expenseTotal).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span></div>
                        </div>
                      </div>
                    )}
                    {isLoading ? <div className="flex justify-center h-48 items-center"><LoaderCircle className="h-8 w-8 animate-spin" /></div> : (
                        <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Company</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {generalLedger.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.date}</TableCell>
                                <TableCell>{item.company}</TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{(item as IncomeTransaction).incomeType || (item as ExpenseTransaction).category}</TableCell>
                                <TableCell><Badge variant={item.transactionType === 'income' ? 'secondary' : 'destructive'} className={cn(item.transactionType === 'income' && 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200')}>{item.transactionType}</Badge></TableCell>
                                <TableCell className={cn("text-right font-mono", item.transactionType === 'income' ? 'text-green-600' : 'text-red-600')}>{item.transactionType === 'income' ? item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" }) : `(${item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })})`}</TableCell>
                                <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => handleOpenTransactionDialog(item.transactionType, item)}><BookOpen className="mr-2 h-4 w-4"/>Open</DropdownMenuItem><DropdownMenuItem onSelect={() => handleOpenTransactionDialog(item.transactionType, item)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => setTransactionToDelete(item)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

               <TabsContent value="income">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Income Transactions</CardTitle><CardDescription>A list of all recorded income.</CardDescription></div>
                        <Button variant="outline" onClick={() => handleOpenTransactionDialog('income')}><PlusCircle className="mr-2 h-4 w-4" /> Add Income</Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <div className="flex justify-center items-center h-48"><LoaderCircle className="h-8 w-8 animate-spin" /></div> : (
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Company</TableHead><TableHead>Description</TableHead><TableHead>Income Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                                <TableBody>{incomeLedger.map(item => ( <TableRow key={item.id}><TableCell>{item.date}</TableCell><TableCell>{item.company}</TableCell><TableCell>{item.description}</TableCell><TableCell>{item.incomeType}</TableCell><TableCell className="text-right font-mono text-green-600">{item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => handleOpenTransactionDialog('income', {...item, transactionType: 'income'})}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => setTransactionToDelete({...item, transactionType: 'income'})}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
                            </Table>
                        )}
                    </CardContent>
                 </Card>
               </TabsContent>

               <TabsContent value="expenses">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Expense Transactions</CardTitle><CardDescription>A list of all recorded expenses.</CardDescription></div>
                        <Button variant="outline" onClick={() => handleOpenTransactionDialog('expense')}><PlusCircle className="mr-2 h-4 w-4" /> Add Expense</Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <div className="flex justify-center items-center h-48"><LoaderCircle className="h-8 w-8 animate-spin" /></div> : (
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Company</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                                <TableBody>{expenseLedger.map(item => (<TableRow key={item.id}><TableCell>{item.date}</TableCell><TableCell>{item.company}</TableCell><TableCell>{item.description}</TableCell><TableCell>{item.category}</TableCell><TableCell className="text-right font-mono text-red-600">({item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })})</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => handleOpenTransactionDialog('expense', {...item, transactionType: 'expense'})}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => setTransactionToDelete({...item, transactionType: 'expense'})}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
               </TabsContent>
            </Tabs>
        </div>
      </div>
      
      {/* Add/Edit Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader className="text-center sm:text-center"><DialogTitle className="text-2xl text-primary font-bold">{transactionToEdit ? 'Edit Transaction' : `Post New ${newTransactionType === 'income' ? 'Income' : 'Expense'}`}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={newTransactionType} onValueChange={(value) => setNewTransactionType(value as 'income' | 'expense')} className="grid grid-cols-2 gap-4">
                <div><RadioGroupItem value="income" id="r-income" className="peer sr-only" /><Label htmlFor="r-income" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600">Income</Label></div>
                <div><RadioGroupItem value="expense" id="r-expense" className="peer sr-only" /><Label htmlFor="r-expense" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 [&:has([data-state=checked])]:border-red-600">Expense</Label></div>
            </RadioGroup>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-date-gl" className="text-right">Date <span className="text-destructive">*</span></Label><Input id="tx-date-gl" type="date" value={newTransaction.date} onChange={(e) => setNewTransaction(prev => ({...prev, date: e.target.value}))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-company-gl" className="text-right">Company <span className="text-destructive">*</span></Label><div className="col-span-3"><Select value={newTransaction.company} onValueChange={(value) => setNewTransaction(prev => ({...prev, company: value}))}><SelectTrigger id="tx-company-gl" className="w-full"><SelectValue placeholder="Select a company" /></SelectTrigger><SelectContent>{defaultCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-doc-number-gl" className="text-right">Document #</Label><Input id="tx-doc-number-gl" value={newTransaction.documentNumber} onChange={(e) => setNewTransaction(prev => ({...prev, documentNumber: e.target.value}))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-description-gl" className="text-right">Description</Label><Input id="tx-description-gl" value={newTransaction.description} onChange={(e) => setNewTransaction(prev => ({...prev, description: e.target.value}))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-amount-gl" className="text-right">Amount <span className="text-destructive">*</span></Label><div className="relative col-span-3"><span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span><Input id="tx-amount-gl" type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction(prev => ({...prev, amount: e.target.value}))} className="pl-7" step="0.01" placeholder="0.00"/></div></div>
            
            {newTransactionType === 'income' && (
                <>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-income-type-gl" className="text-right">Income Type <span className="text-destructive">*</span></Label><div className="col-span-3"><Select value={newTransaction.incomeType} onValueChange={(value) => setNewTransaction(prev => ({...prev, incomeType: value}))}><SelectTrigger id="tx-income-type-gl" className="w-full"><SelectValue placeholder="Select a type" /></SelectTrigger><SelectContent>{defaultIncomeTypes.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-deposit-account-gl" className="text-right">Deposited To</Label><div className="col-span-3"><Select value={newTransaction.depositedTo} onValueChange={(value) => setNewTransaction(prev => ({...prev, depositedTo: value}))}><SelectTrigger id="tx-deposit-account-gl" className="w-full"><SelectValue placeholder="Select an account" /></SelectTrigger><SelectContent>{defaultDepositAccounts.map(acc => <SelectItem key={acc} value={acc}>{acc}</SelectItem>)}</SelectContent></Select></div></div>
                </>
            )}
            {newTransactionType === 'expense' && (
                 <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-category-gl" className="text-right">Category <span className="text-destructive">*</span></Label><div className="col-span-3"><Select value={newTransaction.category} onValueChange={(value) => setNewTransaction(prev => ({...prev, category: value}))}><SelectTrigger id="tx-category-gl" className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{defaultExpenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div></div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-explanation-gl" className="text-right">Explanation</Label><Input id="tx-explanation-gl" value={newTransaction.explanation} onChange={(e) => setNewTransaction(prev => ({...prev, explanation: e.target.value}))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="tx-type-gl" className="text-right">Type</Label><RadioGroup value={newTransaction.type} onValueChange={(value: 'business' | 'personal') => setNewTransaction(prev => ({ ...prev, type: value }))} className="col-span-3 flex items-center space-x-4" id="tx-type-gl"><div className="flex items-center space-x-2"><RadioGroupItem value="business" id="type-business-gl" /><Label htmlFor="type-business-gl">Business</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="personal" id="type-personal-gl" /><Label htmlFor="type-personal-gl">Personal</Label></div></RadioGroup></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setIsTransactionDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveTransaction}>{transactionToEdit ? 'Save Changes' : 'Save Transaction'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the transaction: "{transactionToDelete?.description}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}
