
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
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TransactionsPageHeader } from "@/components/accounting/transactions-page-header";

// Mock data
const incomeData = [
  { id: "inc_1", date: "2024-07-25", source: "Client Alpha", description: "Web Development Services", amount: 5000, category: "Service Revenue", paymentMethod: "ACH", invoiceNumber: "INV-2024-001" },
  { id: "inc_2", date: "2024-07-24", source: "Client Beta", description: "Consulting Retainer - July", amount: 2500, category: "Consulting", paymentMethod: "Credit Card", invoiceNumber: "INV-2024-002" },
  { id: "inc_3", date: "2024-07-22", source: "E-commerce Store", description: "Product Sales", amount: 850.75, category: "Sales Revenue", paymentMethod: "Stripe", invoiceNumber: "N/A" },
  { id: "inc_4", date: "2024-07-20", source: "Affiliate Payout", description: "Q2 Affiliate Earnings", amount: 320.50, category: "Other Income", paymentMethod: "PayPal", invoiceNumber: "N/A" },
];

export function IncomeView() {
  return (
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
        <CardHeader>
          <CardTitle>Income Transactions</CardTitle>
          <CardDescription>A list of all recorded income.</CardDescription>
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
              {incomeData.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.source}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Income
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
