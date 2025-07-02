
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
import { Button } from "@/components/ui/button";
import { Plus, Link2, GitMerge, UserCheck, AlertTriangle } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock Data
type BankAccount = {
  id: string;
  name: string;
  bank: string;
  type: "Business" | "Personal";
  last4: string;
  balance: number;
};

type BankTransaction = {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number; // positive for deposit, negative for withdrawal
  status: "reconciled" | "unreconciled" | "personal";
};

const mockAccounts: BankAccount[] = [
  { id: "acc_1", name: "Primary Checking", bank: "Chase", type: "Business", last4: "1234", balance: 15430.22 },
  { id: "acc_2", name: "High-Yield Savings", bank: "Marcus", type: "Business", last4: "5678", balance: 85000.00 },
  { id: "acc_3", name: "Personal Checking", bank: "Chase", type: "Personal", last4: "9012", balance: 5210.50 },
];

const mockTransactions: BankTransaction[] = [
  // Business Account Transactions
  { id: "txn_b_1", accountId: "acc_1", date: "2024-07-25", description: "ACH from Client Alpha", amount: 5000, status: "reconciled" },
  { id: "txn_b_2", accountId: "acc_1", date: "2024-07-25", description: "Cloud Hosting Inc.", amount: -150, status: "reconciled" },
  { id: "txn_b_3", accountId: "acc_1", date: "2024-07-24", description: "Stripe Payout", amount: 850.75, status: "reconciled" },
  { id: "txn_b_4", accountId: "acc_1", date: "2024-07-23", description: "SaaS Tools Co.", amount: -75.99, status: "reconciled" },
  { id: "txn_b_5", accountId: "acc_1", date: "2024-07-22", description: "TRANSFER TO ACC_2", amount: -10000, status: "reconciled" },
  { id: "txn_b_6", accountId: "acc_1", date: "2024-07-21", description: "Gas Station - Shell", amount: -55.45, status: "unreconciled" }, // Mixed use example
  { id: "txn_b_7", accountId: "acc_1", date: "2024-07-20", description: "Office Depot", amount: -45.30, status: "unreconciled" },
  
  // Savings Account Transactions
  { id: "txn_s_1", accountId: "acc_2", date: "2024-07-22", description: "TRANSFER FROM ACC_1", amount: 10000, status: "reconciled" },
  { id: "txn_s_2", accountId: "acc_2", date: "2024-07-31", description: "Interest Payment", amount: 35.42, status: "unreconciled" },

  // Personal Account Transactions
  { id: "txn_p_1", accountId: "acc_3", date: "2024-07-21", description: "Freelance Designer", amount: -800, status: "unreconciled" }, // Business expense on personal card
  { id: "txn_p_2", accountId: "acc_3", date: "2024-07-22", description: "Restaurant - The Cafe", amount: -125.60, status: "personal" },
  { id: "txn_p_3", accountId: "acc_3", date: "2024-07-23", description: "Salary Deposit", amount: 4500, status: "personal" },
];

const ReconciliationActions = () => (
  <Card className="bg-muted/50">
    <CardHeader>
      <CardTitle className="text-base">Reconciliation Actions</CardTitle>
      <CardDescription className="text-xs">For unreconciled transactions from a business account:</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4">
        <div className="flex items-start gap-3">
          <Link2 className="h-5 w-5 mt-1 text-primary shrink-0"/>
          <div>
            <h4 className="font-semibold">Match to Ledger</h4>
            <p className="text-sm text-muted-foreground">Find and link this to an existing income or expense entry.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <GitMerge className="h-5 w-5 mt-1 text-primary shrink-0"/>
          <div>
            <h4 className="font-semibold">Create & Reconcile</h4>
            <p className="text-sm text-muted-foreground">Create a new ledger entry from this transaction and link them.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <UserCheck className="h-5 w-5 mt-1 text-primary shrink-0"/>
          <div>
            <h4 className="font-semibold">Mark as Personal</h4>
            <p className="text-sm text-muted-foreground">Tag as a personal expense. It will be ignored in business reports.</p>
          </div>
        </div>
    </CardContent>
  </Card>
);

export function BankStatementsView() {
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>(mockAccounts[0].id);

  const selectedAccount = mockAccounts.find(acc => acc.id === selectedAccountId);
  const transactions = mockTransactions.filter(txn => txn.accountId === selectedAccountId);

  const getStatusBadge = (status: BankTransaction['status']) => {
    switch (status) {
      case 'reconciled':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Reconciled</Badge>;
      case 'unreconciled':
        return <Badge variant="destructive">Unreconciled</Badge>;
      case 'personal':
        return <Badge variant="outline">Personal</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Bank Statements" />
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Bank Statement Reconciliation
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect your bank accounts to automatically import transactions. Reconcile them against your ledgers to ensure accuracy.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bank Accounts</CardTitle>
                <CardDescription>Your connected accounts.</CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAccounts.map(account => (
                  <button key={account.id} className={cn("w-full text-left p-3 rounded-lg border transition-colors", selectedAccountId === account.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50")} onClick={() => setSelectedAccountId(account.id)}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">{account.name} ({account.bank})</span>
                      <Badge variant={account.type === 'Business' ? 'default' : 'secondary'}>{account.type}</Badge>
                    </div>
                    <div className="flex justify-between items-end text-sm">
                      <span className="text-muted-foreground">...{account.last4}</span>
                      <span className="font-mono">{account.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <ReconciliationActions />
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transactions for {selectedAccount?.name}</CardTitle>
              <CardDescription>
                Review and reconcile transactions for the selected account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(txn => (
                      <TableRow key={txn.id}>
                        <TableCell>{txn.date}</TableCell>
                        <TableCell>
                          {txn.description}
                          {txn.accountId === 'acc_3' && txn.description.includes('Freelance Designer') && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Business expense on personal account.</span>
                            </div>
                          )}
                          {txn.accountId === 'acc_1' && txn.description.includes('Gas Station') && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Potential mixed business/personal use.</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn("text-right font-mono", txn.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                          {txn.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(txn.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {txn.status === 'unreconciled' && (
                            <Button variant="outline" size="sm">Reconcile</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
