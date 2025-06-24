"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";


export function VitalsView() {
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
                <Card className="w-full max-w-md">
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
            </div>
        </div>
    );
}
