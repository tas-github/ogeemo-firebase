
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getIncomeTransactions, getExpenseTransactions, getAssets, type IncomeTransaction, type ExpenseTransaction, type Asset } from '@/services/accounting-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { AccountingPageHeader } from './page-header';
import { IncomeStatementFormDisplay } from './income-statement-form-display';
import { t2125ExpenseCategories, t2125IncomeCategories } from '@/data/standard-expense-categories';

// --- Data Calculation Logic ---
function useIncomeStatementData(income: IncomeTransaction[], expenses: ExpenseTransaction[], assets: Asset[]) {
    
    const standardIncomeCategoryMap = useMemo(() => {
        const map = new Map<string, string>();
        t2125IncomeCategories.forEach(cat => map.set(cat.line, cat.description));
        return map;
    }, []);

    const standardExpenseCategoryMap = useMemo(() => {
        const map = new Map<string, string>();
        t2125ExpenseCategories.forEach(cat => map.set(cat.line, cat.description));
        return map;
    }, []);

    const categorizedIncome = useMemo(() => {
        const result: Record<string, number> = {};
        t2125IncomeCategories.forEach(cat => {
            result[cat.description] = 0;
        });

        income.forEach(tx => {
            const amount = Number(tx.totalAmount) || 0;
            const categoryNumber = tx.incomeCategory;
            // Use the map to find the human-readable description from the stored number
            const categoryDescription = standardIncomeCategoryMap.get(categoryNumber);

            if (categoryDescription) {
                result[categoryDescription] = (result[categoryDescription] || 0) + amount;
            } else {
                // If it's a custom category (e.g., 'C-1'), it falls into "Other income"
                result['Other income'] = (result['Other income'] || 0) + amount;
            }
        });
        
        return result;
    }, [income, standardIncomeCategoryMap]);


    const grossIncome = useMemo(() => Object.values(categorizedIncome).reduce((sum, amount) => sum + amount, 0), [categorizedIncome]);

    const cca = useMemo(() => {
        // This is a placeholder calculation. Real CCA is much more complex.
        return assets.reduce((sum, asset) => {
            const assetDepreciation = (Number(asset.undepreciatedCapitalCost) || 0) * 0.10; 
            return sum + assetDepreciation;
        }, 0);
    }, [assets]);

    const categorizedExpenses = useMemo(() => {
        const result: Record<string, number> = {};
        
        t2125ExpenseCategories.forEach(cat => {
            result[cat.description] = 0;
        });
        
        expenses.forEach(tx => {
            const amount = Number(tx.totalAmount) || 0;
            const categoryNumber = tx.category;
            // Use the map to find the human-readable description from the stored number
            const categoryDescription = standardExpenseCategoryMap.get(categoryNumber);
            
            if (categoryDescription) {
                 result[categoryDescription] = (result[categoryDescription] || 0) + amount;
            } else {
                 // If it's a custom category (e.g., 'C-1'), it falls into "Other expenses"
                 result['Other expenses'] = (result['Other expenses'] || 0) + amount;
            }
        });
        
        // Assign the calculated CCA value to its specific category
        result['Capital cost allowance (CCA)'] = cca;
        
        return result;
    }, [expenses, cca, standardExpenseCategoryMap]);
    
    const totalExpenses = useMemo(() => Object.values(categorizedExpenses).reduce((sum, amount) => sum + amount, 0), [categorizedExpenses]);
    const netIncome = grossIncome - totalExpenses;

    return { categorizedIncome, grossIncome, categorizedExpenses, totalExpenses, netIncome };
}


// --- Main View Component ---
export function IncomeStatementView() {
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

    const { categorizedIncome, grossIncome, categorizedExpenses, totalExpenses, netIncome } = useIncomeStatementData(income, expenses, assets);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading Ledger Data...</p>
                </div>
            </div>
        );
    }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Income Statement" />
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Income Statement
        </h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          This is a simplified statement populated with data from your ledgers, structured like CRA Form T2125 for review purposes. This is not official tax advice.
        </p>
      </header>

      <div className="max-w-4xl mx-auto">
        <IncomeStatementFormDisplay 
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
