
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getIncomeTransactions, getExpenseTransactions, type IncomeTransaction, type ExpenseTransaction } from '@/services/accounting-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, AlertCircle, Printer, FileDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AccountingPageHeader } from './page-header';

// These categories map directly to lines on the T2125 form.
// In a real app, you would have a more robust mapping system.
const T2125ExpenseCategories = {
  'Advertising': '8521',
  'Meals': '8523',
  'Insurance': '8690',
  'Interest': '8710',
  'Business fees, dues, and memberships': '8760',
  'Office expenses': '8810',
  'Office stationery and supplies': '8811',
  'Professional fees': '8860',
  'Management and administration fees': '8871',
  'Rent': '8910',
  'Repairs and maintenance': '8960',
  'Salaries, wages, and benefits': '9060',
  'Property taxes': '9180',
  'Travel expenses': '9200',
  'Utilities': '9220',
  'Fuel costs (except for motor vehicles)': '9224',
  'Delivery, freight, and express': '9275',
  'Capital cost allowance (depreciation)': '9936',
  'Other expenses': '9270',
};
type T2125Category = keyof typeof T2125ExpenseCategories;

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const LabeledAmount = ({ label, amount, line, bold = false }: { label: string, amount: number, line: string, bold?: boolean }) => (
    <div className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 rounded-md">
        <div className="flex items-center">
            <p className={bold ? 'font-semibold' : ''}>{label}</p>
            <span className="ml-2 text-xs text-muted-foreground">(Line {line})</span>
        </div>
        <p className={`font-mono ${bold ? 'font-bold' : ''}`}>{formatCurrency(amount)}</p>
    </div>
);

export function T2125View() {
    const [income, setIncome] = useState<IncomeTransaction[]>([]);
    const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [incomeData, expenseData] = await Promise.all([
                    getIncomeTransactions(user.uid),
                    getExpenseTransactions(user.uid),
                ]);
                setIncome(incomeData);
                setExpenses(expenseData);
            } catch (error: any) {
                toast({ variant: 'destructive', title: "Failed to load ledger data", description: error.message });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user, toast]);

    const grossIncome = useMemo(() => income.reduce((sum, tx) => sum + tx.amount, 0), [income]);

    const categorizedExpenses = useMemo(() => {
        const result: Record<string, number> = {};
        for (const category in T2125ExpenseCategories) {
            result[category] = 0;
        }

        expenses.forEach(tx => {
            const categoryKey = Object.keys(T2125ExpenseCategories).find(key => key.toLowerCase().includes(tx.category.toLowerCase()));
            if (categoryKey) {
                result[categoryKey] += tx.amount;
            } else {
                result['Other expenses'] += tx.amount;
            }
        });
        return result;
    }, [expenses]);
    
    const totalExpenses = useMemo(() => Object.values(categorizedExpenses).reduce((sum, amount) => sum + amount, 0), [categorizedExpenses]);
    const netIncome = grossIncome - totalExpenses;

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="T2125 Statement" />
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Statement of Business Activities (T2125)
        </h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          This is a simplified mock-up of the T2125 form, populated with data from your ledgers. This is not official tax advice.
        </p>
      </header>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle>T2125 - Identification and Income</CardTitle>
            <CardDescription>Part 1 & 3: Business Information and Income Summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="biz-name">Business Name</Label>
                <Input id="biz-name" defaultValue="Your Business Name" />
            </div>
            <Separator className="my-6"/>
            <h3 className="font-semibold">Part 3A - Business income</h3>
             <LabeledAmount label="Gross sales, commissions, or fees" line="16" amount={grossIncome} bold/>
        </CardContent>
      </Card>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle>Part 5 - Business Expenses</CardTitle>
            <CardDescription>Summary of deductible business expenses from your ledger.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
           {Object.entries(categorizedExpenses).map(([category, amount]) => {
                const line = T2125ExpenseCategories[category as T2125Category];
                if (amount === 0) return null;
                return <LabeledAmount key={line} label={category} amount={amount} line={line} />
           })}
           <Separator className="my-2"/>
           <LabeledAmount label="Total expenses" line="9369" amount={totalExpenses} bold/>
        </CardContent>
      </Card>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle>Net Income (Loss) Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <LabeledAmount label="Gross income" line="A" amount={grossIncome} />
            <LabeledAmount label="Total expenses" line="B" amount={-totalExpenses} />
            <Separator className="my-2" />
            <LabeledAmount label="Net income (loss)" line="C" amount={netIncome} bold/>
        </CardContent>
        <CardFooter className="justify-between items-center">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4"/>
                <span>For demonstration purposes only.</span>
            </div>
            <div className="flex gap-2">
                <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                <Button><FileDown className="mr-2 h-4 w-4"/> Download as PDF</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
