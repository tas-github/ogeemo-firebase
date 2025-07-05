
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, BookText, TrendingDown, TrendingUp } from "lucide-react";

export default function BksInfoPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="BKS Info" />
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Bookkeeping Kept Simple (BKS)
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
            Your straightforward path to financial clarity. We believe that managing your books does not have to be complicated.
        </p>
      </header>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
            <CardTitle>The Core Concept</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-card-foreground">
            <p className="leading-relaxed">
                This is a simple cash-based accounting system. Out of the many ledgers available, you only need to focus on two to start: <strong>Manage Income</strong> and <strong>Manage Expenses</strong>.
            </p>
            <p className="leading-relaxed">
                By consistently recording all the money that comes in (income) and all the money that goes out (expenses), you will capture the essential information required for tax preparation and gain a clear picture of your business's financial health.
            </p>
            <p className="leading-relaxed">
                When you're ready to take your accounting to the next level, all the advanced tools you need are waiting for you right here in the main Accounting Hub.
            </p>
        </CardContent>
      </Card>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp className="h-5 w-5 text-primary"/></div>
                    <CardTitle className="text-lg">Manage Income</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Record all incoming revenue from sales, services, and other sources.</p>
            </CardContent>
            <CardContent>
                 <Button asChild className="w-full">
                    <Link href="/accounting/transactions/income">Go to Income <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><TrendingDown className="h-5 w-5 text-primary"/></div>
                    <CardTitle className="text-lg">Manage Expenses</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Track all business expenditures, from supplies to software.</p>
            </CardContent>
            <CardContent>
                 <Button asChild className="w-full">
                    <Link href="/accounting/transactions/expenses">Go to Expenses <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
