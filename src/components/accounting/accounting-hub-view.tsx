
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Receipt, Activity, BarChart3, ArrowRight, BookText, WalletCards, FileDigit, FileOutput, FileInput } from "lucide-react";

export function AccountingHubView() {
  const features = [
    {
      icon: UserPlus,
      title: "Client Onboarding",
      description: "Set up new clients using AI-powered tax return analysis or manual entry.",
      href: "/accounting/onboarding",
      cta: "Go to Onboarding",
    },
    {
      icon: Receipt,
      title: "Transactions",
      description: "View, manage, and categorize all your transactions in one place.",
      href: "/accounting/transactions",
      cta: "View Hub",
    },
    {
      icon: Activity,
      title: "Financial Vitals",
      description: "Get a real-time pulse on your key financial metrics and overall health.",
      href: "/accounting/vitals",
      cta: "Check Vitals",
    },
    {
      icon: BookText,
      title: "General Ledger",
      description: "Review detailed income and expense ledgers with customizable views.",
      href: "/accounting/ledgers",
      cta: "View Ledger",
    },
    {
      icon: WalletCards,
      title: "Bank Statements",
      description: "Connect accounts and reconcile transactions against your ledgers.",
      href: "/accounting/bank-statements",
      cta: "Manage Statements",
    },
    {
      icon: FileOutput,
      title: "Accounts Receivable",
      description: "Track money owed to you by clients from outstanding invoices.",
      href: "/accounting/invoices/payments",
      cta: "Manage Receivables",
    },
    {
      icon: FileInput,
      title: "Accounts Payable",
      description: "Track money you owe to vendors and suppliers from bills.",
      href: "/accounting/accounts-payable",
      cta: "Manage Payables",
    },
    {
      icon: FileDigit,
      title: "Invoice Manager",
      description: "Create and manage professional invoices for your clients.",
      href: "/accounting/invoices",
      cta: "Go to Invoice Manager",
    },
    {
      icon: BarChart3,
      title: "Reporting Hub",
      description: "Generate and view reports tailored for different stakeholders.",
      href: "/accounting/reports",
      cta: "Go to Reports",
    },
    {
      icon: BookText,
      title: "Bookkeeping Kept Simple",
      description: "BKS is for those who want to KISS.",
      href: "/accounting/bks-info",
      cta: "Go to BKS",
    },
  ];

  const sortedFeatures = features.sort((a,b) => {
      const order = ["Client Onboarding", "Accounts Receivable", "Accounts Payable", "Transactions", "General Ledger", "Bank Statements", "Financial Vitals", "Invoice Manager", "Reporting Hub", "Bookkeeping Kept Simple"];
      return order.indexOf(a.title) - order.indexOf(b.title);
  });

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-bold font-headline text-primary">
          New World Accounting Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your central command for a common-sense approach to finance. Select a manager to continue.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {sortedFeatures.map((feature) => (
          <Card key={feature.title} className="flex flex-col">
            <CardHeader className="p-4 flex flex-row items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription className="text-sm mt-1">{feature.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1" />
            <CardFooter className="p-4 pt-0">
                <Button asChild size="sm" className="w-full">
                  <Link href={feature.href}>
                    {feature.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
