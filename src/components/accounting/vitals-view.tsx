
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  LoaderCircle,
  Landmark,
} from 'lucide-react';
import { AccountingPageHeader } from '@/components/accounting/page-header';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getIncomeTransactions,
  getExpenseTransactions,
  getInvoices,
  getPayableBills,
  getEquityTransactions,
  type IncomeTransaction,
  type ExpenseTransaction,
  type Invoice,
  type PayableBill,
  type EquityTransaction,
} from '@/services/accounting-service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const VitalsCard = ({ title, value, icon: Icon, description, colorClass }: { title: string; value: string; icon: React.ElementType; description: string; colorClass?: string; }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${colorClass || ''}`}>{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

export function VitalsView() {
  const [income, setIncome] = useState<IncomeTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payableBills, setPayableBills] = useState<PayableBill[]>([]);
  const [equityTransactions, setEquityTransactions] = useState<EquityTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [
          incomeData,
          expenseData,
          invoiceData,
          payableData,
          equityData,
        ] = await Promise.all([
          getIncomeTransactions(user.uid),
          getExpenseTransactions(user.uid),
          getInvoices(user.uid),
          getPayableBills(user.uid),
          getEquityTransactions(user.uid),
        ]);
        setIncome(incomeData);
        setExpenses(expenseData);
        setInvoices(invoiceData);
        setPayableBills(payableData);
        setEquityTransactions(equityData);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Failed to load financial data',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, toast]);
  
  const financialMetrics = useMemo(() => {
    const totalIncome = income.reduce((sum, tx) => sum + tx.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, tx) => sum + tx.totalAmount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    const accountsReceivable = invoices.reduce((sum, inv) => {
        const balance = inv.originalAmount - inv.amountPaid;
        return sum + (balance > 0 ? balance : 0);
    }, 0);

    const accountsPayable = payableBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

    const netEquity = equityTransactions.reduce((sum, tx) => sum + (tx.type === 'contribution' ? tx.amount : -tx.amount), 0);

    return { totalIncome, totalExpenses, netIncome, accountsReceivable, accountsPayable, netEquity };
  }, [income, expenses, invoices, payableBills, equityTransactions]);

  const chartData = [
    {
        name: 'Financials',
        income: financialMetrics.totalIncome,
        expenses: financialMetrics.totalExpenses,
    }
  ];

  if (isLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Financial Vitals...</p>
            </div>
        </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Financial Vitals" />
      <div className="flex flex-col items-center">
        <header className="text-center mb-6 max-w-4xl">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Financial Vitals
          </h1>
          <p className="text-muted-foreground">
            Your key financial numbers, at a glance.
          </p>
        </header>
        <div className="w-full max-w-5xl space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <VitalsCard 
                    title="Net Income (YTD)"
                    value={formatCurrency(financialMetrics.netIncome)}
                    description="Total income minus total expenses."
                    icon={DollarSign}
                    colorClass={financialMetrics.netIncome >= 0 ? "text-primary" : "text-destructive"}
                />
                <VitalsCard 
                    title="Accounts Receivable"
                    value={formatCurrency(financialMetrics.accountsReceivable)}
                    description="Money your clients owe you."
                    icon={TrendingUp}
                    colorClass="text-green-600"
                />
                <VitalsCard 
                    title="Accounts Payable"
                    value={formatCurrency(financialMetrics.accountsPayable)}
                    description="Money you owe to vendors."
                    icon={TrendingDown}
                    colorClass="text-red-600"
                />
                <VitalsCard 
                    title="Net Owner's Equity"
                    value={formatCurrency(financialMetrics.netEquity)}
                    description="Owner contributions minus draws."
                    icon={Landmark}
                />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Income vs. Expenses</CardTitle>
                    <CardDescription>A visual comparison of your total income and expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                            <Bar dataKey="income" fill="#10B981" name="Total Income" />
                            <Bar dataKey="expenses" fill="#EF4444" name="Total Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
