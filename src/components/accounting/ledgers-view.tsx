
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
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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


const incomeCategories = ["Service Revenue", "Consulting", "Sales Revenue", "Other Income"];
const expenseCategories = ["Utilities", "Software", "Office Supplies", "Contractors", "Marketing", "Travel", "Meals"];
const allCategories = [...incomeCategories, ...expenseCategories];

// --- COMPONENT ---

export function LedgersView() {
  const [incomeLedger, setIncomeLedger] = React.useState(initialIncomeData);
  const [expenseLedger, setExpenseLedger] = React.useState(initialExpenseData);

  const generalLedger = React.useMemo(() => {
    const combined = [
      ...incomeLedger.map(item => ({ ...item, type: 'income' as const })),
      // Normalize `vendor` to `source` for consistent display in the general ledger
      ...expenseLedger.map(item => ({ ...item, source: item.vendor, type: 'expense' as const })),
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomeLedger, expenseLedger]);

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

  return (
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

        <Tabs defaultValue="general" className="w-full max-w-6xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General Ledger</TabsTrigger>
            <TabsTrigger value="income">Income Ledger</TabsTrigger>
            <TabsTrigger value="expenses">Expense Ledger</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
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
              <CardHeader>
                  <CardTitle>Income Ledger</CardTitle>
                  <CardDescription>All incoming revenue streams.</CardDescription>
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
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                  <CardTitle>Expense Ledger</CardTitle>
                  <CardDescription>All outgoing expenditures.</CardDescription>
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
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
