
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
  CardFooter,
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
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// --- MOCK DATA & TYPES ---

const initialIncomeData = [
  { id: "inc_1", date: "2024-07-25", source: "Client Alpha", description: "Web Development Services", amount: 5000, category: "Service Revenue" },
  { id: "inc_2", date: "2024-07-24", source: "Client Beta", description: "Consulting Retainer - July", amount: 2500, category: "Consulting" },
  { id: "inc_3", date: "2024-07-22", source: "E-commerce Store", description: "Product Sales", amount: 850.75, category: "Sales Revenue" },
  { id: "inc_4", date: "2024-07-20", source: "Affiliate Payout", description: "Q2 Affiliate Earnings", amount: 320.50, category: "Other Income" },
];

const initialExpenseData = [
  { id: "exp_1", date: "2024-07-25", vendor: "Cloud Hosting Inc.", description: "Server Costs - July", amount: 150, category: "Utilities" },
  { id: "exp_2", date: "2024-07-23", vendor: "SaaS Tools Co.", description: "Software Subscriptions", amount: 75.99, category: "Software" },
  { id: "exp_3", date: "2024-07-21", vendor: "Office Supply Hub", description: "Stationery and Supplies", amount: 45.30, category: "Office Supplies" },
  { id: "exp_4", date: "2024-07-20", vendor: "Freelance Designer", description: "Logo Design", amount: 800, category: "Contractors" },
];

type IncomeTransaction = typeof initialIncomeData[0];
type ExpenseTransaction = typeof initialExpenseData[0];
type GeneralTransaction = (IncomeTransaction & { type: 'income' }) | (ExpenseTransaction & { type: 'expense', source: string });

const INCOME_CATEGORIES_KEY = "accountingIncomeCategories";
const EXPENSE_CATEGORIES_KEY = "accountingExpenseCategories";

const defaultIncomeCategories = ["Service Revenue", "Consulting", "Sales Revenue", "Other Income"];
const defaultExpenseCategories = ["Utilities", "Software", "Office Supplies", "Contractors", "Marketing", "Travel", "Meals"];

const emptyIncomeForm = { date: '', source: '', description: '', amount: '', category: '' };
const emptyExpenseForm = { date: '', vendor: '', description: '', amount: '', category: '' };

// --- COMPONENT ---

export function LedgersView() {
  const [incomeLedger, setIncomeLedger] = React.useState(initialIncomeData);
  const [expenseLedger, setExpenseLedger] = React.useState(initialExpenseData);

  const [incomeCategories, setIncomeCategories] = React.useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = React.useState<string[]>([]);
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [newIncomeCategory, setNewIncomeCategory] = React.useState("");
  const [newExpenseCategory, setNewExpenseCategory] = React.useState("");
  
  const [isAddIncomeDialogOpen, setIsAddIncomeDialogOpen] = React.useState(false);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = React.useState(false);

  const [newIncome, setNewIncome] = React.useState(emptyIncomeForm);
  const [newExpense, setNewExpense] = React.useState(emptyExpenseForm);


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
    return incomeLedger.reduce((sum, item) => sum + item.amount, 0);
  }, [incomeLedger]);

  const expenseTotal = React.useMemo(() => {
    return expenseLedger.reduce((sum, item) => sum + item.amount, 0);
  }, [expenseLedger]);

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

  const handleSaveIncome = () => {
    const amountNum = parseFloat(newIncome.amount);
    if (!newIncome.date || !newIncome.source || !newIncome.category || !newIncome.amount || isNaN(amountNum) || amountNum <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill all fields correctly.' });
      return;
    }
    const newEntry: IncomeTransaction = {
      id: `inc_${Date.now()}`,
      date: newIncome.date,
      source: newIncome.source.trim(),
      description: newIncome.description.trim(),
      amount: amountNum,
      category: newIncome.category,
    };
    setIncomeLedger(prev => [newEntry, ...prev]);
    setIsAddIncomeDialogOpen(false);
    setNewIncome(emptyIncomeForm);
    toast({ title: "Income Transaction Added" });
  };
  
  const handleSaveExpense = () => {
    const amountNum = parseFloat(newExpense.amount);
    if (!newExpense.date || !newExpense.vendor || !newExpense.category || !newExpense.amount || isNaN(amountNum) || amountNum <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill all fields correctly.' });
      return;
    }
    const newEntry: ExpenseTransaction = {
      id: `exp_${Date.now()}`,
      date: newExpense.date,
      vendor: newExpense.vendor.trim(),
      description: newExpense.description.trim(),
      amount: amountNum,
      category: newExpense.category,
    };
    setExpenseLedger(prev => [newEntry, ...prev]);
    setIsAddExpenseDialogOpen(false);
    setNewExpense(emptyExpenseForm);
    toast({ title: "Expense Transaction Added" });
  };


  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="General Ledgers" />
        <div className="flex flex-col items-center">
          <header className="text-center mb-6 max-w-4xl">
            <h1 className="text-3xl font-bold font-headline text-primary">
              General Ledgers
            </h1>
            <p className="text-muted-foreground">
              A unified view of your income and expenses. Categorize transactions to keep your books in order.
            </p>
          </header>

          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <Tabs defaultValue="general" className="w-full max-w-6xl">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                  <TabsTrigger value="general">General Ledger</TabsTrigger>
                  <TabsTrigger value="income">Income Ledger</TabsTrigger>
                  <TabsTrigger value="expenses">Expense Ledger</TabsTrigger>
                </TabsList>
                <DialogTrigger asChild>
                  <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Manage Categories</Button>
                </DialogTrigger>
              </div>
              
              <TabsContent value="general">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle>General Ledger</CardTitle>
                    <CardDescription>A combined view of all income and expense transactions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generalLedger.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.date}</TableCell>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="income">
                <Card>
                  <CardHeader className="text-center relative">
                      <CardTitle>Income Ledger</CardTitle>
                      <CardDescription>All incoming revenue streams.</CardDescription>
                      <div className="absolute top-4 right-4 text-right">
                          <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                          <p className="text-xl font-bold text-green-600">{incomeTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" onClick={() => setIsAddIncomeDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Income
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="expenses">
                <Card>
                  <CardHeader className="text-center relative">
                      <CardTitle>Expense Ledger</CardTitle>
                      <CardDescription>All outgoing expenditures.</CardDescription>
                      <div className="absolute top-4 right-4 text-right">
                          <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                          <p className="text-xl font-bold text-red-600">({expenseTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })})</p>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" onClick={() => setIsAddExpenseDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                  </CardFooter>
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
      
      {/* Add Income Dialog */}
      <Dialog open={isAddIncomeDialogOpen} onOpenChange={setIsAddIncomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="income-date" className="text-right">Date</Label>
              <Input id="income-date" type="date" value={newIncome.date} onChange={(e) => setNewIncome(prev => ({...prev, date: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="income-source" className="text-right">Source</Label>
              <Input id="income-source" value={newIncome.source} onChange={(e) => setNewIncome(prev => ({...prev, source: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="income-description" className="text-right">Description</Label>
              <Input id="income-description" value={newIncome.description} onChange={(e) => setNewIncome(prev => ({...prev, description: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="income-amount" className="text-right">Amount</Label>
              <Input id="income-amount" type="number" value={newIncome.amount} onChange={(e) => setNewIncome(prev => ({...prev, amount: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="income-category" className="text-right">Category</Label>
              <Select value={newIncome.category} onValueChange={(value) => setNewIncome(prev => ({...prev, category: value}))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddIncomeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveIncome}>Add Income</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
       <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-date" className="text-right">Date</Label>
              <Input id="expense-date" type="date" value={newExpense.date} onChange={(e) => setNewExpense(prev => ({...prev, date: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-vendor" className="text-right">Vendor</Label>
              <Input id="expense-vendor" value={newExpense.vendor} onChange={(e) => setNewExpense(prev => ({...prev, vendor: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-description" className="text-right">Description</Label>
              <Input id="expense-description" value={newExpense.description} onChange={(e) => setNewExpense(prev => ({...prev, description: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-amount" className="text-right">Amount</Label>
              <Input id="expense-amount" type="number" value={newExpense.amount} onChange={(e) => setNewExpense(prev => ({...prev, amount: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-category" className="text-right">Category</Label>
              <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({...prev, category: value}))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddExpenseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveExpense}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
