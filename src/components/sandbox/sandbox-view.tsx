
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
import { UserPlus, Receipt, Activity, BarChart3, ArrowRight, BookText, WalletCards, FileDigit } from "lucide-react";

export function SandboxView() {
  const features = [
    {
      icon: UserPlus,
      title: "Client Onboarding",
      description: "Set up new clients using AI-powered tax return analysis or manual entry.",
      href: "#",
      cta: "Go to Onboarding",
    },
    {
      icon: Receipt,
      title: "Transactions",
      description: "View, manage, and categorize all your income and expenses in one place.",
      href: "#",
      cta: "View Transactions",
    },
    {
      icon: Activity,
      title: "Financial Vitals",
      description: "Get a real-time pulse on your key financial metrics and overall health.",
      href: "#",
      cta: "Check Vitals",
    },
    {
      icon: BookText,
      title: "General Ledgers",
      description: "Review detailed income and expense ledgers with customizable views.",
      href: "#",
      cta: "View Ledgers",
    },
    {
      icon: WalletCards,
      title: "Bank Statements",
      description: "Connect accounts and reconcile transactions against your ledgers.",
      href: "#",
      cta: "Manage Statements",
    },
    {
      icon: FileDigit,
      title: "Invoice Manager",
      description: "Create and manage professional invoices for your clients.",
      href: "#",
      cta: "Go to Invoice Manager",
    },
    {
      icon: BarChart3,
      title: "Reporting Hub",
      description: "Generate and view reports tailored for different stakeholders.",
      href: "#",
      cta: "Go to Reports",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Sandbox: Accounting Hub Test
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This is a test implementation of the Accounting Hub.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {features.map((feature) => (
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
