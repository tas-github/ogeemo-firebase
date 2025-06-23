
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  FilePlus2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileOutput,
  User,
  Bank,
  ShieldCheck,
  PlusCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for recent transactions
const recentTransactions = [
  {
    id: "txn_1",
    description: "Web Development Services",
    amount: 2500.0,
    type: "income",
    date: "2024-07-15",
  },
  {
    id: "txn_2",
    description: "Office Software Subscription",
    amount: -45.0,
    type: "expense",
    date: "2024-07-14",
  },
  {
    id: "txn_3",
    description: "Client A - Project Deposit",
    amount: 1200.0,
    type: "income",
    date: "2024-07-12",
  },
  {
    id: "txn_4",
    description: "Business Lunch",
    amount: -85.5,
    type: "expense",
    date: "2024-07-11",
  },
  {
    id: "txn_5",
    description: "Home Office Internet",
    amount: -70.0,
    type: "expense",
    date: "2024-07-10",
  },
];

export default function AccountingPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          New World Accounting Manager
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A common-sense approach to your finances, built for clarity and
          purpose. Let's manage your money based on what you actually need to
          know.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>AI-Powered Client Onboarding</CardTitle>
              <CardDescription>
                Get started instantly by uploading a recent tax return, or enter
                your details manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4 p-8">
              <Button size="lg" className="h-16 w-full sm:w-auto">
                <UploadCloud className="mr-4 h-6 w-6" />
                Upload Tax Return PDF
              </Button>
              <span className="text-muted-foreground font-semibold">OR</span>
              <Button size="lg" variant="secondary" className="h-16 w-full sm:w-auto">
                <FilePlus2 className="mr-4 h-6 w-6" />
                Manual Data Entry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                A real-time look at your income and expenses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-medium">
                        {txn.description}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono",
                          txn.type === "income"
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        {txn.amount.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </TableCell>
                      <TableCell>{txn.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            txn.type === "income" ? "secondary" : "destructive"
                          }
                          className={cn(
                            txn.type === 'income' && 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                          )}
                        >
                          {txn.type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Transaction
                </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Vitals</CardTitle>
              <CardDescription>Your key numbers, at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Net Position</span>
                </div>
                <span className="font-bold text-lg">$42,850.75</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-md">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="font-medium">Monthly Income</span>
                </div>
                <span className="font-bold text-lg text-green-500">$3,700.00</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-md">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="font-medium">Monthly Expenses</span>
                </div>
                <span className="font-bold text-lg text-red-500">($200.50)</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reporting Hub</CardTitle>
              <CardDescription>
                Generate reports tailored for any audience.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start">
                <User className="mr-2 h-4 w-4" /> Owner's View
              </Button>
              <Button variant="outline" className="justify-start">
                <Bank className="mr-2 h-4 w-4" /> Banker's View
              </Button>
              <Button variant="outline" className="justify-start">
                <ShieldCheck className="mr-2 h-4 w-4" /> Tax Auditor's View
              </Button>
               <Button variant="outline" className="justify-start">
                <FileText className="mr-2 h-4 w-4" /> All Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
