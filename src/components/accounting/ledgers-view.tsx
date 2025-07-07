
"use client";

import * as React from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Settings, Plus, Trash2, PlusCircle, MoreVertical, BookOpen, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- MOCK DATA & TYPES ---

const initialIncomeData = [
  { id: "inc_1", date: "2024-07-25", source: "Client Alpha", company: "Alpha Inc.", description: "Web Development Services", amount: 5000, category: "Service Revenue", explanation: "Contracted services", documentNumber: "INV-2024-001" },
  { id: "inc_2", date: "2024-07-24", source: "Client Beta", company: "Beta Corp.", description: "Consulting Retainer - July", amount: 2500, category: "Consulting", explanation: "Monthly retainer", documentNumber: "INV-2024-002" },
  { id: "inc_3", date: "2024-07-22", source: "E-commerce Store", company: "Ogeemo Store", description: "Product Sales", amount: 850.75, category: "Sales Revenue", explanation: "Online sales", documentNumber: "SALE-9876" },
  { id: "inc_4", date: "2024-07-20", source: "Affiliate Payout", company: "PartnerStack", description: "Q2 Affiliate Earnings", amount: 320.50, category: "Other Income", explanation: "Referral commissions", documentNumber: "PS-PAY-Q2" },
];

const initialExpenseData = [
  { id: "exp_1", date: "2024-07-25", vendor: "Cloud Hosting Inc.", company: "Cloud Hosting Inc.", description: "Server Costs - July", amount: 150, category: "Utilities", explanation: "Monthly server maintenance", documentNumber: "CH-98765" },
  { id: "exp_2", date: "2024-07-23", vendor: "SaaS Tools Co.", company: "SaaS Tools Co.", description: "Software Subscriptions", amount: 75.99, category: "Software", explanation: "Team software licenses", documentNumber: "STC-11223" },
  { id: "exp_3", date: "2024-07-21", vendor: "Office Supply Hub", company: "Office Supply Hub", description: "Stationery and Supplies", amount: 45.30, category: "Office Supplies", explanation: "Restocking office supplies", documentNumber: "OSH-5543" },
  { id: "exp_4", date: "2024-07-20", vendor: "Freelance Designer", company: "Jane Designs", description: "Logo Design", amount: 800, category: "Contractors", explanation: "New logo design for marketing campaign", documentNumber: "INV-JD-001" },
];

type IncomeTransaction = typeof initialIncomeData[0];
type ExpenseTransaction = typeof initialExpenseData[0];
type GeneralTransaction = (IncomeTransaction & { type: 'income' }) | (ExpenseTransaction & { type: 'expense', source: string });

const INCOME_CATEGORIES_KEY = "accountingIncomeCategories";
const EXPENSE_CATEGORIES_KEY = "accountingExpenseCategories";

const defaultIncomeCategories = ["Service Revenue", "Consulting", "Sales Revenue", "Other Income"];
const defaultExpenseCategories = ["Utilities", "Software", "Office Supplies", "Contractors", "Marketing", "Travel", "Meals"];

const emptyTransactionForm = { date: '', party: '', company: '', description: '', amount: '', category: '', explanation: '', documentNumber: '' };


// --- COMPONENT ---

export function LedgersView() {
  const [incomeLedger, setIncomeLedger] = React.useState(initialIncomeData);
  const [expenseLedger, setExpenseLedger] = React.useState(initialExpenseData);

  const [incomeCategories, setIncomeCategories] = React.useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = React.useState<string[]>([]);
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [newIncomeCategory, setNewIncomeCategory] = React.useState("");
  const [newExpenseCategory, setNewExpenseCategory] = React.useState("");
  
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = React.useState(false);
  const [transactionToEdit, setTransactionToEdit] = React.useState<GeneralTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = React.useState<GeneralTransaction | null>(null);
  const [newTransactionType, setNewTransactionType] = React.useState<'income' | 'expense'>('income');
  const [newTransaction, setNewTransaction] = React.useState(emptyTransactionForm);

  const [showTotals, setShowTotals] = React.useState(false);


  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const savedIncome = localStorage.getItem(INCOME_CATEGORIES_KEY);
      setIncomeCategories(savedIncome ? JSON.parse(savedIncome) : defaultIncomeCategories);

      const savedExpense = localStorage.getItem(EXPENSE_CATEGORIES_KEY);
      setExpenseCategories(savedExpense ? JSON.parse(savedExpense) : defaultExpenseCategories);
    } catch (error) {
        console.error("Failed to load categories from localStorage", error);
        setIncomeCategories(defaultIncomeCategories);
        setExpenseCategories(defaultExpenseCategories);
    }
  }, []);

  const generalLedger = React.useMemo(() => {
    const combined = [
      ...incomeLedger.map(item => ({ ...item, type: 'income' as const })),
      ...expenseLedger.map(item => ({ ...item, source: item.vendor, type: 'expense' as const })),
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomeLedger, expenseLedger]);
  
  const allCategories = React.useMemo(() => [...new Set([...incomeCategories, ...expenseCategories])], [incomeCategories, expenseCategories]);

  const incomeTotal = React.useMemo(() => {
    return generalLedger.filter(t => t.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  }, [generalLedger]);

  const expenseTotal = React.useMemo(() => {
    return generalLedger.filter(t => t.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  }, [generalLedger]);

  const handleCategoryChange = (id: string, newCategory: string, type: 'income' | 'expense') => {
    if (type === 'income') {
      setIncomeLedger(prev =>
        prev.map(item => (item.id === id ? { ...item, category: newCategory } : item))
      );
    } else {
      setExpenseLedger(prev =>
        prev.map(item => (item.id === id ? { ...item, category: newCategory } : item))
      );
    }
  };
  
  const handleAddCategory = (type: 'income' | 'expense') => {
    if (type === 'income') {
        const categoryToAdd = newIncomeCategory.trim();
        if (!categoryToAdd) {
            toast({ variant: 'destructive', title: 'Category name cannot be empty.' }); return;
        }
        if (incomeCategories.map(c => c.toLowerCase()).includes(categoryToAdd.toLowerCase())) {
             toast({ variant: 'destructive', title: 'Duplicate Category', description: 'This category already exists.' }); return;
        }
        const updated = [...incomeCategories, categoryToAdd];
        setIncomeCategories(updated);
        localStorage.setItem(INCOME_CATEGORIES_KEY, JSON.stringify(updated));
        setNewIncomeCategory("");
    } else {
        const categoryToAdd = newExpenseCategory.trim();
        if (!categoryToAdd) {
            toast({ variant: 'destructive', title: 'Category name cannot be empty.' }); return;
        }
        if (expenseCategories.map(c => c.toLowerCase()).includes(categoryToAdd.toLowerCase())) {
             toast({ variant: 'destructive', title: 'Duplicate Category', description: 'This category already exists.' }); return;
        }
        const updated = [...expenseCategories, categoryToAdd];
        setExpenseCategories(updated);
        localStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(updated));
        setNewExpenseCategory("");
    }
  };
  
  const handleDeleteCategory = (category: string, type: 'income' | 'expense') => {
     if (type === 'income') {
        if (incomeLedger.some(item => item.category === category)) {
            toast({ variant: 'destructive', title: 'Cannot Delete', description: 'This category is currently in use in the income ledger.' });
            return;
        }
        const updated = incomeCategories.filter(c => c !== category);
        setIncomeCategories(updated);
        localStorage.setItem(INCOME_CATEGORIES_KEY, JSON.stringify(updated));
     } else {
        if (expenseLedger.some(item => item.category === category)) {
            toast({ variant: 'destructive', title: 'Cannot Delete', description: 'This category is currently in use in the expense ledger.' });
            return;
        }
        const updated = expenseCategories.filter(c => c !== category);
        setExpenseCategories(updated);
        localStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(updated));
     }
  };
  
    const handleOpenTransactionDialog = (type: 'income' | 'expense', transaction?: GeneralTransaction) => {
        setNewTransactionType(type);
        if (transaction) {
            setTransactionToEdit(transaction);
            setNewTransaction({
                date: transaction.date,
                party: transaction.source,
                company: transaction.company || '',
                description: transaction.description,
                amount: String(transaction.amount),
                category: transaction.category,
                explanation: (transaction as any).explanation || '',
                documentNumber: transaction.documentNumber || '',
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
            documentNumber: newTransaction.documentNumber.trim(),
        };

        if (transactionToEdit) { // Handle editing existing transaction
            if (transactionToEdit.type === 'income') {
                setIncomeLedger(prev => prev.map(item => item.id === transactionToEdit.id ? { ...item, ...transactionData, source: newTransaction.party.trim() } : item));
                toast({ title: "Income Transaction Updated" });
            } else {
                setExpenseLedger(prev => prev.map(item => item.id === transactionToEdit.id ? { ...item, ...transactionData, vendor: newTransaction.party.trim() } : item));
                toast({ title: "Expense Transaction Updated" });
            }
        } else { // Handle adding new transaction
            if (newTransactionType === 'income') {
                const newEntry: IncomeTransaction = { id: `inc_${Date.now()}`, ...transactionData, source: newTransaction.party.trim() };
                setIncomeLedger(prev => [newEntry, ...prev]);
                toast({ title: "Income Transaction Added" });
            } else {
                const newEntry: ExpenseTransaction = { id: `exp_${Date.now()}`, ...transactionData, vendor: newTransaction.party.trim() };
                setExpenseLedger(prev => [newEntry, ...prev]);
                toast({ title: "Expense Transaction Added" });
            }
        }

        setIsTransactionDialogOpen(false);
        setTransactionToEdit(null);
        setNewTransaction(emptyTransactionForm);
    };
    
    const handleConfirmDelete = () => {
        if (!transactionToDelete) return;
        if (transactionToDelete.type === 'income') {
            setIncomeLedger(prev => prev.filter(item => item.id !== transactionToDelete.id));
        } else {
            setExpenseLedger(prev => prev.filter(item => item.id !== transactionToDelete.id));
        }
        toast({ title: 'Transaction Deleted' });
        setTransactionToDelete(null);
    };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="General Ledgers" />
        <div className="flex flex-col">
          <header className="text-center mb-6 w-full mx-auto">
            <h1 className="text-3xl font-bold font-headline text-primary">
              General Ledgers
            </h1>
            <p className="text-muted-foreground">
              A unified view of your income and expenses. Categorize transactions to keep your books in order.
            </p>
          </header>

          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <Tabs defaultValue="general" className="w-full">
              <div className="flex justify-center items-center mb-4">
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                  <TabsTrigger value="general">General Ledger</TabsTrigger>
                  <TabsTrigger value="income">Income Ledger</TabsTrigger>
                  <TabsTrigger value="expenses">Expense Ledger</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="general">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>General Ledger</CardTitle>
                      <CardDescription>A combined view of all income and expense transactions.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => handleOpenTransactionDialog('income')}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Post Transaction
                        </Button>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Manage Categories</Button>
                        </DialogTrigger>
                        <Button variant="outline" onClick={() => setShowTotals(!showTotals)}>Totals</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showTotals && (
                      <div className="mb-4 rounded-lg border bg-muted/50 p-3">
                        <div className="w-full max-w-xs space-y-1 text-right ml-auto">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Total Income:</span>
                            <span className="font-mono font-medium text-green-600">{incomeTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Total Expenses:</span>
                            <span className="font-mono font-medium text-red-600">({expenseTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })})</span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Net Position:</span>
                            <span className="font-mono">{(incomeTotal - expenseTotal).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Party</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generalLedger.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.source}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              <Select
                                value={item.category}
                                onValueChange={(newCategory) => handleCategoryChange(item.id, newCategory, item.type)}
                              >
                                <SelectTrigger className="w-[180px] h-9">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.type === 'income' ? 'secondary' : 'destructive'} className={cn(item.type === 'income' && 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200')}>
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={cn("text-right font-mono", item.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                              {item.type === 'income' ? item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" }) : `(${item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })})`}
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
                                  <DropdownMenuItem onSelect={() => handleOpenTransactionDialog(item.type, item)}><BookOpen className="mr-2 h-4 w-4"/>Open</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleOpenTransactionDialog(item.type, item)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
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
              </TabsContent>

              <TabsContent value="income">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle>Income Ledger</CardTitle>
                        <CardDescription>All incoming revenue streams.</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                            <p className="text-xl font-bold text-green-600">{incomeTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => handleOpenTransactionDialog('income')}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Income
                            </Button>
                            <DialogTrigger asChild>
                                <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Manage Categories</Button>
                            </DialogTrigger>
                        </div>
                    </div>
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
                            <TableCell>
                              <Select value={item.category} onValueChange={(newCategory) => handleCategoryChange(item.id, newCategory, 'income')}>
                                  <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                                  <SelectContent>{incomeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-mono text-green-600">{item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</TableCell>
                            <TableCell>
                               <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => handleOpenTransactionDialog('income', { ...item, type: 'income' })}><BookOpen className="mr-2 h-4 w-4"/>Open</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleOpenTransactionDialog('income', { ...item, type: 'income' })}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onSelect={() => setTransactionToDelete({ ...item, type: 'income' })}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div>
                          <CardTitle>Expense Ledger</CardTitle>
                          <CardDescription>All outgoing expenditures.</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-4">
                          <div className="text-right">
                              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                              <p className="text-xl font-bold text-red-600">({expenseTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })})</p>
                          </div>
                          <div className="flex items-center gap-2">
                              <Button variant="outline" onClick={() => handleOpenTransactionDialog('expense')}>
                                  <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                              </Button>
                              <DialogTrigger asChild>
                                  <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Manage Categories</Button>
                              </DialogTrigger>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseLedger.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.vendor}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              <Select value={item.category} onValueChange={(newCategory) => handleCategoryChange(item.id, newCategory, 'expense')}>
                                  <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                                  <SelectContent>{expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-mono text-red-600">({item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })})</TableCell>
                            <TableCell>
                               <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => handleOpenTransactionDialog('expense', { ...item, source: item.vendor, type: 'expense' })}><BookOpen className="mr-2 h-4 w-4"/>Open</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleOpenTransactionDialog('expense', { ...item, source: item.vendor, type: 'expense' })}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onSelect={() => setTransactionToDelete({ ...item, source: item.vendor, type: 'expense' })}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
        </div>
      </div>
      
      {/* Add/Edit Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transactionToEdit ? 'Edit Transaction' : 'Post New Transaction'}</DialogTitle>
            <DialogDescription>Select the transaction type and fill in the details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={newTransactionType} onValueChange={(value) => setNewTransactionType(value as 'income' | 'expense')} className="grid grid-cols-2 gap-4">
                <div><RadioGroupItem value="income" id="r-income" className="peer sr-only" /><Label htmlFor="r-income" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Income</Label></div>
                <div><RadioGroupItem value="expense" id="r-expense" className="peer sr-only" /><Label htmlFor="r-expense" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Expense</Label></div>
            </RadioGroup>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-date" className="text-right">Date</Label>
              <Input id="tx-date" type="date" value={newTransaction.date} onChange={(e) => setNewTransaction(prev => ({...prev, date: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-party" className="text-right">{newTransactionType === 'income' ? 'Source' : 'Vendor'}</Label>
              <Input id="tx-party" value={newTransaction.party} onChange={(e) => setNewTransaction(prev => ({...prev, party: e.target.value}))} className="col-span-3" />
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
              <Label htmlFor="tx-amount" className="text-right">Amount</Label>
              <Input id="tx-amount" type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction(prev => ({...prev, amount: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-category" className="text-right">Category</Label>
              <Select value={newTransaction.category} onValueChange={(value) => setNewTransaction(prev => ({...prev, category: value}))}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {(newTransactionType === 'income' ? incomeCategories : expenseCategories).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
            <Button onClick={handleSaveTransaction}>{transactionToEdit ? 'Save Changes' : 'Save Transaction'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
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
