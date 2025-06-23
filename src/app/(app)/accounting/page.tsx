
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Receipt, Activity, BarChart3, ArrowRight, BookText, WalletCards } from "lucide-react";

export default function AccountingHubPage() {
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
      description: "View, manage, and categorize all your income and expenses in one place.",
      href: "/accounting/transactions",
      cta: "View Transactions",
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
      title: "General Ledgers",
      description: "Review detailed income and expense ledgers with customizable views.",
      href: "/accounting/ledgers",
      cta: "View Ledgers",
    },
    {
      icon: WalletCards,
      title: "Bank Statements",
      description: "Connect accounts and reconcile transactions against your ledgers.",
      href: "/accounting/bank-statements",
      cta: "Manage Statements",
    },
    {
      icon: BarChart3,
      title: "Reporting Hub",
      description: "Generate and view reports tailored for different stakeholders.",
      href: "/accounting/reports",
      cta: "Go to Reports",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          New World Accounting Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your central command for a common-sense approach to finance. Select a manager to continue.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1" />
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                  <Link href={feature.href}>
                    {feature.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
