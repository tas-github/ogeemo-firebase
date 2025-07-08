
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FilePlus2, Landmark, CreditCard, Wallet, Info } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const expenseCategories = [
  "Advertising", "Car & Truck Expenses", "Commissions & Fees",
  "Contract Labor", "Depreciation", "Insurance", "Interest",
  "Legal & Professional Services", "Office Expense", "Rent or Lease",
  "Repairs & Maintenance", "Supplies", "Taxes & Licenses",
  "Travel", "Meals", "Utilities", "Wages"
];

export function OnboardingView() {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <AccountingPageHeader pageTitle="Client Onboarding" />
            <div className="flex flex-col items-center">
                <header className="text-center mb-6 max-w-4xl">
                    <h1 className="text-3xl font-bold font-headline text-primary">
                    Client Onboarding
                    </h1>
                    <p className="text-muted-foreground">
                    A streamlined process to get your clients set up quickly and accurately.
                    </p>
                </header>

                <div className="w-full max-w-3xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UploadCloud className="h-6 w-6 text-primary" />
                                AI-Powered Onboarding
                            </CardTitle>
                            <CardDescription>
                                The fastest way to get started. Upload a recent tax return (like a Schedule C) and let our AI extract the necessary information to set up your accounts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button size="lg">
                                <UploadCloud className="mr-4 h-6 w-6" />
                                Upload Tax Return PDF
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="relative">
                        <Separator />
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-2 text-sm text-muted-foreground">OR</span>
                        </div>
                    </div>
                    
                    <Card>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1" className="border-b-0">
                                <AccordionTrigger className="p-6 text-left hover:no-underline">
                                     <div className="flex items-center gap-2 text-primary">
                                        <FilePlus2 className="h-6 w-6" />
                                        <div className="flex flex-col items-start">
                                            <CardTitle>Manual Onboarding</CardTitle>
                                            <CardDescription className="mt-1">
                                                Set up your books by providing the following information.
                                            </CardDescription>
                                        </div>
                                     </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="space-y-6 rounded-lg bg-muted/50 p-4 border">
                                        <div>
                                            <h4 className="font-semibold text-foreground">Business Information</h4>
                                            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                                                <li>Business Name & Address</li>
                                                <li>Employer ID Number (EIN), if applicable</li>
                                                <li>Accounting Method (Cash or Accrual)</li>
                                            </ul>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h4 className="font-semibold text-foreground">Financial Accounts</h4>
                                            <p className="text-sm text-muted-foreground mt-1">List all accounts used for business transactions.</p>
                                            <div className="mt-4 space-y-4">
                                                <Card className="bg-background">
                                                    <CardHeader className="p-3 flex flex-row items-center gap-3">
                                                         <Landmark className="h-5 w-5 text-primary" />
                                                         <p className="font-semibold">Bank Accounts</p>
                                                    </CardHeader>
                                                </Card>
                                                 <Card className="bg-background">
                                                    <CardHeader className="p-3 flex flex-row items-center gap-3">
                                                         <CreditCard className="h-5 w-5 text-primary" />
                                                         <p className="font-semibold">Credit Cards</p>
                                                    </CardHeader>
                                                </Card>
                                                 <Card className="bg-background">
                                                    <CardHeader className="p-3 flex flex-row items-center gap-3">
                                                         <Wallet className="h-5 w-5 text-primary" />
                                                         <p className="font-semibold">Cash Account</p>
                                                    </CardHeader>
                                                </Card>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h4 className="font-semibold text-foreground">Income & Expense Categories</h4>
                                            <p className="text-sm text-muted-foreground mt-1">This helps properly categorize your transactions for tax purposes.</p>
                                             <div className="flex items-center gap-2 p-2 mt-2 text-xs text-blue-800 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded-md">
                                                <Info className="h-4 w-4 shrink-0"/>
                                                <span>You will be able to add, edit, or remove these categories later.</span>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                <h5 className="font-medium text-sm">Common Expense Categories:</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {expenseCategories.map(cat => (
                                                        <div key={cat} className="text-xs bg-background border rounded-full px-2 py-0.5 text-muted-foreground">{cat}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                </div>
            </div>
        </div>
    );
}
