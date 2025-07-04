
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ListFilter } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { cn } from "@/lib/utils";

const initialIncomeData = [
  { id: "inc_1", date: "2024-07-25", source: "Client Alpha", description: "Web Development Services", amount: 5000, category: "Service Revenue", paymentMethod: "ACH", invoiceNumber: "INV-2024-001" },
  { id: "inc_2", date: "2024-07-24", source: "Client Beta", description: "Consulting Retainer - July", amount: 2500, category: "Consulting", paymentMethod: "Credit Card", invoiceNumber: "INV-2024-002" },
  { id: "inc_3", date: "2024-07-22", source: "E-commerce Store", description: "Product Sales", amount: 850.75, category: "Sales Revenue", paymentMethod: "Stripe", invoiceNumber: "N/A" },
  { id: "inc_4", date: "2024-07-20", source: "Affiliate Payout", description: "Q2 Affiliate Earnings", amount: 320.50, category: "Other Income", paymentMethod: "PayPal", invoiceNumber: "N/A" },
];

const initialExpenseData = [
  { id: "exp_1", date: "2024-07-25", vendor: "Cloud Hosting Inc.", description: "Server Costs - July", amount: 150, category: "Utilities", paymentMethod: "Auto-Draft", receiptNumber: "CH-98765" },
  { id: "exp_2", date: "2024-07-23", vendor: "SaaS Tools Co.", description: "Software Subscriptions", amount: 75.99, category: "Software", paymentMethod: "Credit Card", receiptNumber: "STC-12345" },
  { id: "exp_3", date: "2024-07-21", vendor: "Office Supply Hub", description: "Stationery and Supplies", amount: 45.30, category: "Office Supplies", paymentMethod: "Credit Card", receiptNumber: "OSH-55443" },
  { id: "exp_4", date: "2024-07-20", vendor: "Freelance Designer", description: "Logo Design", amount: 800, category: "Contractors", paymentMethod: "Bank Transfer", receiptNumber: "FD-001" },
];

const incomeCategories = ["Service Revenue", "Consulting", "Sales Revenue", "Other Income", "Uncategorized"];
const expenseCategories = ["Utilities", "Software", "Office Supplies", "Contractors", "Marketing", "Travel", "Meals", "Uncategorized"];
const allCategories = [...new Set([...incomeCategories, ...expenseCategories])];

type IncomeColumn = "date" | "source" | "description" | "amount" | "category" | "paymentMethod" | "invoiceNumber";
type ExpenseColumn = "date" | "vendor" | "description" | "amount" | "category" | "paymentMethod" | "receiptNumber";

const incomeColumnLabels: Record<IncomeColumn, string> = {
  date: "Date",
  source: "Source",
  description: "Description",
  amount: "Amount",
  category: "Category",
  paymentMethod: "Payment Method",
  invoiceNumber: "Invoice #",
};

const expenseColumnLabels: Record<ExpenseColumn, string> = {
  date: "Date",
  vendor: "Vendor",
  description: "Description",
  amount: "Amount",
  category: "Category",
  paymentMethod: "Payment Method",
  receiptNumber: "Receipt #",
};

type GeneralLedgerEntry = {
    id: string;
    type: 'income' | 'expense';
    date: string;
    payeePayer: string;
    description: string;
    category: string;
    amount: number;
}

export function LedgersView() {
  const [incomeLedger, setIncomeLedger] = React.useState(initialIncomeData);
  const [expenseLedger, setExpenseLedger] = React.useState(initialExpenseData);
  const [generalLedger, setGeneralLedger] = React.useState<GeneralLedgerEntry[]>([]);

  const [visibleIncomeColumns, setVisibleIncomeColumns] = React.useState<Record<IncomeColumn, boolean>>({
    date: true,
    source: true,
    description: true,
    amount: true,
    category: true,
    paymentMethod: false,
    invoiceNumber: true,
  });

  const [visibleExpenseColumns, setVisibleExpenseColumns] = React.useState<Record<ExpenseColumn, boolean>>({
    date: true,
    vendor: true,
    description: true,
    amount: true,
    category: true,
    paymentMethod: false,
    receiptNumber: false,
  });

  React.useEffect(() => {
    const combinedIncome = incomeLedger.map(item => ({
        ...item,
        type: 'income' as const,
        payeePayer: item.source,
    }));
    const combinedExpenses = expenseLedger.map(item => ({
        ...item,
        type: 'expense' as const,
        payeePayer: item.vendor,
        amount: -item.amount,
    }));

    const combined = [...combinedIncome, ...combinedExpenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setGeneralLedger(combined);
  }, [incomeLedger, expenseLedger]);

  const activeIncomeColumns = (Object.keys(visibleIncomeColumns) as IncomeColumn[]).filter(key => visibleIncomeColumns[key]);
  const activeExpenseColumns = (Object.keys(visibleExpenseColumns) as ExpenseColumn[]).filter(key => visibleExpenseColumns[key]);

  const handleIncomeCategoryChange = (id: string, newCategory: string) => {
    setIncomeLedger(prev =>
      prev.map(item => (item.id === id ? { ...item, category: newCategory } : item))
    );
  };

  const handleExpenseCategoryChange = (id: string, newCategory: string) => {
    setExpenseLedger(prev =>
      prev.map(item => (item.id === id ? { ...item, category: newCategory } : item))
    );
  };

  const handleGeneralLedgerCategoryChange = (id: string, type: 'income' | 'expense', newCategory: string) => {
      if (type === 'income') {
          handleIncomeCategoryChange(id, newCategory);
      } else {
          handleExpenseCategoryChange(id, newCategory);
      }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="General Ledgers" />
      <div className="flex flex-col items-center">
        <header className="text-center mb-6 max-w-4xl">
          <h1 className="text-3xl font-bold font-headline text-primary">
            General Ledgers
          </h1>
          <p className="text-muted-foreground">
            A common-sense view of your income and expenses. Toggle columns and categorize transactions.
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
                      <TableHead>Payee/Payer</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generalLedger.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.payeePayer}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                            <Select value={item.category} onValueChange={(newCategory) => handleGeneralLedgerCategoryChange(item.id, item.type, newCategory)}>
                                <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                {allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell className={cn(
                            "text-right font-mono",
                            item.type === 'income' ? 'text-green-600' : 'text-red-600'
                        )}>
                            {item.amount.toLocaleString("en-US", { style: "currency", currency: "USD", signDisplay: 'auto' })}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Income</CardTitle>
                  <CardDescription>All incoming revenue streams.</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto h-8 flex">
                      <ListFilter className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(incomeColumnLabels).map(([key, label]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        className="capitalize"
                        checked={visibleIncomeColumns[key as IncomeColumn]}
                        onCheckedChange={(value) =>
                          setVisibleIncomeColumns(prev => ({...prev, [key]: Boolean(value)}))
                        }
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeIncomeColumns.map(col => (
                        <TableHead key={col}>{incomeColumnLabels[col]}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeLedger.map(item => (
                      <TableRow key={item.id}>
                        {activeIncomeColumns.map(col => {
                          if (col === 'category') {
                            return (
                              <TableCell key={`${item.id}-${col}`} onClick={(e) => e.stopPropagation()}>
                                <Select value={item.category} onValueChange={(newCategory) => handleIncomeCategoryChange(item.id, newCategory)}>
                                  <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {incomeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={`${item.id}-${col}`}>
                              {col === 'amount'
                                ? item[col].toLocaleString("en-US", { style: "currency", currency: "USD" })
                                : item[col as keyof typeof item]}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>All outgoing expenditures.</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto h-8 flex">
                      <ListFilter className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(expenseColumnLabels).map(([key, label]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        className="capitalize"
                        checked={visibleExpenseColumns[key as ExpenseColumn]}
                        onCheckedChange={(value) =>
                          setVisibleExpenseColumns(prev => ({...prev, [key]: Boolean(value)}))
                        }
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeExpenseColumns.map(col => (
                        <TableHead key={col}>{expenseColumnLabels[col]}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseLedger.map(item => (
                      <TableRow key={item.id}>
                        {activeExpenseColumns.map(col => {
                           if (col === 'category') {
                            return (
                              <TableCell key={`${item.id}-${col}`} onClick={(e) => e.stopPropagation()}>
                                <Select value={item.category} onValueChange={(newCategory) => handleExpenseCategoryChange(item.id, newCategory)}>
                                  <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={`${item.id}-${col}`}>
                              {col === 'amount'
                                ? `(${item[col].toLocaleString("en-US", { style: "currency", currency: "USD" })})`
                                : item[col as keyof typeof item]}
                            </TableCell>
                          )
                        })}
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
