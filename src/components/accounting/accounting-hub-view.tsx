
"use client";

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Calculator,
  FileOutput,
  FileDigit,
  DollarSign,
  Landmark,
  ShieldCheck,
  FileText,
  UserPlus,
  BookText,
  WalletCards,
  Activity,
  User,
  Banknote,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  cta: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, href, cta }) => (
  <Card className="flex flex-col">
    <CardHeader>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex-1" />
    <CardFooter>
      <Button asChild className="w-full">
        <Link href={href}>
          {cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

const actionItems = [
    { href: "/accounting/invoices/create", icon: FileDigit, label: "Create New Invoice" },
    { href: "/accounting/transactions/income", icon: DollarSign, label: "Add Income Transaction" },
    { href: "/accounting/transactions/expenses", icon: Banknote, label: "Add Expense Transaction" },
    { href: "/accounting/onboarding", icon: UserPlus, label: "Onboard New Client" },
]

export function AccountingHubView() {
  const features = [
    { icon: FileOutput, title: "Accounts Receivable", description: "Manage all outstanding invoices and payments due from clients.", href: "/accounting/accounts-receivable", cta: "Go to A/R" },
    { icon: User, title: "Owner's View", description: "Key questions a business owner needs answered at a glance.", href: "/accounting/reports", cta: "Go to Reports" },
    { icon: BookText, title: "General Ledger", description: "View a unified list of all income and expense transactions.", href: "/accounting/ledgers", cta: "Go to Ledger" },
    { icon: ShieldCheck, title: "Tax Auditor's View", description: "Detailed records required for tax preparation and audits.", href: "/accounting/tax", cta: "Go to Tax Center" },
    { icon: Landmark, title: "Banker's View", description: "The essential financial statements for credit analysis and loans.", href: "/accounting/bank-statements", cta: "Go to Bank Statements" },
    { icon: WalletCards, title: "Capital Assets", description: "Track your business's capital assets, manage depreciation, and record disposals.", href: "/accounting/asset-management", cta: "Manage Assets" },
    { icon: Activity, title: "Financial Vitals", description: "A quick glance at your most important financial numbers.", href: "/accounting/vitals", cta: "Check Vitals" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <div className="flex justify-center items-center gap-4 mb-2">
            <Calculator className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold font-headline text-primary">
            Accounting Hub
            </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your central command for managing finances, from invoicing and payments to reporting and tax preparation.
        </p>
        <div className="mt-4">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        Action Items
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {actionItems.map(item => (
                         <DropdownMenuItem key={item.href} asChild>
                            <Link href={item.href}>
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
}
