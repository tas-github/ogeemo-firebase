
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data for the sandbox transaction manager
const mockTransactions = [
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

export function SandboxView() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold font-headline text-primary mb-6">
        Sandbox Environment
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Transaction Manager (Sandbox)</CardTitle>
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
              {mockTransactions.map((txn) => (
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
      </Card>
    </div>
  );
}
