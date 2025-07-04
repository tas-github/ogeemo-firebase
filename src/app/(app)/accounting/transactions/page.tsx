import Link from "next/link";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookText, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

export default function TransactionsHubPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Transaction Hub" />
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Transaction Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your income, expenses, and transaction categorization from here.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Manage Income</CardTitle>
                    <CardDescription>
                    Record and categorize all incoming revenue.
                    </CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1" />
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                <Link href="/accounting/transactions/income">
                    Go to Income
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                </Button>
            </div>
        </Card>

        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Manage Expenses</CardTitle>
                    <CardDescription>
                    Track and classify all business expenditures.
                    </CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1" />
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                <Link href="/accounting/transactions/expenses">
                    Go to Expenses
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                </Button>
            </div>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>General Ledger</CardTitle>
                <CardDescription>
                  View a unified list of all income and expense transactions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1" />
          <div className="p-6 pt-0">
            <Button asChild className="w-full">
              <Link href="/accounting/ledgers">
                Go to General Ledger
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
