
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getIncomeTransactions, getExpenseTransactions, getAssets, type IncomeTransaction, type ExpenseTransaction, type Asset } from '@/services/accounting-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { AccountingPageHeader } from './page-header';
import { T2125FormDisplay } from './t2125-form-display';
import { t2125ExpenseCategories, t2125IncomeCategories } from '@/data/standard-expense-categories';

// --- Data Calculation Logic ---
function useT2125Data(income: IncomeTransaction[], expenses: ExpenseTransaction[], assets: Asset[]) {
    const categorizedIncome = useMemo(() => {
        const result: Record<string, number> = {};
        t2125IncomeCategories.forEach(cat => {
            result[cat.description] = 0;
        });

        income.forEach(tx => {
            if (tx.incomeCategory === 'Other Income') {
                result['Other income'] += tx.totalAmount;
            } else {
                result['Sales, commissions, or fees'] += tx.totalAmount;
            }
        });
        return result;
    }, [income]);

    const grossIncome = useMemo(() => Object.values(categorizedIncome).reduce((sum, amount) => sum + amount, 0), [categorizedIncome]);

    const cca = useMemo(() => {
        return assets.reduce((sum, asset) => {
            const assetDepreciation = (asset.undepreciatedCapitalCost || 0) * 0.10; // Simplified CCA for demo
            return sum + assetDepreciation;
        }, 0);
    }, [assets]);

    const categorizedExpenses = useMemo(() => {
        const result: Record<string, number> = {};
        
        t2125ExpenseCategories.forEach(cat => {
            result[cat.description] = 0;
        });

        expenses.forEach(tx => {
            const txCategoryLower = tx.category.toLowerCase();
            const categoryMatch = t2125ExpenseCategories.find(standardCat => 
                txCategoryLower.includes(standardCat.description.toLowerCase())
            );

            if (categoryMatch) {
                result[categoryMatch.description] += tx.totalAmount;
            } else {
                result['Other expenses'] = (result['Other expenses'] || 0) + tx.totalAmount;
            }
        });
        
        result['Capital cost allowance (CCA)'] = cca;

        return result;
    }, [expenses, cca]);
    
    const totalExpenses = useMemo(() => Object.values(categorizedExpenses).reduce((sum, amount) => sum + amount, 0), [categorizedExpenses]);
    const netIncome = grossIncome - totalExpenses;

    return { categorizedIncome, grossIncome, categorizedExpenses, totalExpenses, netIncome };
}


// --- Main View Component ---
export function T2125View() {
    const [income, setIncome] = useState<IncomeTransaction[]>([]);
    const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
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
                const [incomeData, expenseData, assetData] = await Promise.all([
                    getIncomeTransactions(user.uid),
                    getExpenseTransactions(user.uid),
                    getAssets(user.uid),
                ]);
                setIncome(incomeData);
                setExpenses(expenseData);
                setAssets(assetData);
            } catch (error: any) {
                toast({ variant: 'destructive', title: "Failed to load ledger data", description: error.message });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user, toast]);

    const { categorizedIncome, grossIncome, categorizedExpenses, totalExpenses, netIncome } = useT2125Data(income, expenses, assets);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Business Activity Statement" />
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Business Activity Statement
        </h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          This is a simplified statement populated with data from your ledgers. This is not official tax advice.
        </p>
      </header>

      <div className="max-w-4xl mx-auto">
        <T2125FormDisplay 
            categorizedIncome={categorizedIncome}
            grossIncome={grossIncome}
            categorizedExpenses={categorizedExpenses}
            totalExpenses={totalExpenses}
            netIncome={netIncome}
        />
      </div>
    </div>
  );
}
