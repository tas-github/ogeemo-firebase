
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp, ShieldCheck } from "lucide-react";

export default function BksWelcomePage() {
  return (
    <div className="p-4 sm:p-6 space-y-8 flex flex-col items-center">
      <header className="text-center max-w-3xl">
        <h1 className="text-4xl font-bold font-headline text-primary">
          Bookkeeping Kept Simple
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
            Your straightforward path to financial clarity. Start with the basics, expand when you're ready.
        </p>
      </header>
      
      <Card className="w-full max-w-3xl">
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
        </CardContent>
      </Card>

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg"><TrendingUp className="h-6 w-6 text-primary"/></div>
                    <CardTitle className="text-xl">Manage Income</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Record all incoming revenue from sales, services, and other sources.</p>
            </CardContent>
            <CardContent>
                 <Button asChild className="w-full text-lg py-6">
                    <Link href="/accounting/ledgers?tab=income">Go to Income <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </CardContent>
        </Card>
        <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg"><TrendingDown className="h-6 w-6 text-primary"/></div>
                    <CardTitle className="text-xl">Manage Expenses</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Track all business expenditures, from supplies to software.</p>
            </CardContent>
            <CardContent>
                 <Button asChild className="w-full text-lg py-6">
                    <Link href="/accounting/ledgers?tab=expenses">Go to Expenses <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </CardContent>
        </Card>
      </div>

      <div className="text-center mt-4">
          <p className="text-muted-foreground">Ready for more?</p>
          <Button asChild variant="link" className="text-base">
              <Link href="/accounting">
                Explore Advanced Accounting Tools <ShieldCheck className="ml-2 h-4 w-4" />
              </Link>
          </Button>
      </div>
    </div>
  );
}
