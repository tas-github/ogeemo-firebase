"use client";

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
import { PlusCircle } from "lucide-react";
import { TransactionsPageHeader } from "@/components/accounting/transactions-page-header";

// Mock data
const expenseData = [
  { id: "exp_1", date: "2024-07-25", vendor: "Cloud Hosting Inc.", description: "Server Costs - July", amount: 150, category: "Utilities", paymentMethod: "Auto-Draft", receiptNumber: "CH-98765" },
  { id: "exp_2", date: "2024-07-23", vendor: "SaaS Tools Co.", description: "Software Subscriptions", amount: 75.99, category: "Software", paymentMethod: "Credit Card", receiptNumber: "STC-12345" },
  { id: "exp_3", date: "2024-07-21", vendor: "Office Supply Hub", description: "Stationery and Supplies", amount: 45.30, category: "Office Supplies", paymentMethod: "Credit Card", receiptNumber: "OSH-55443" },
  { id: "exp_4", date: "2024-07-20", vendor: "Freelance Designer", description: "Logo Design", amount: 800, category: "Contractors", paymentMethod: "Bank Transfer", receiptNumber: "FD-001" },
];

export function ExpenseView() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <TransactionsPageHeader pageTitle="Manage Expenses" />
       <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Expenses
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Review and manage all business expenditures.
        </p>
      </header>

       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expense Transactions</CardTitle>
            <CardDescription>A list of all recorded expenses.</CardDescription>
          </div>
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>
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
              {expenseData.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.vendor}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    ({item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })})
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
