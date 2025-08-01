
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { X, ChevronDown, FileOutput, FileDigit, TrendingUp, TrendingDown, BookText, FileInput, WalletCards, BarChart3, Activity, UserPlus, Info, Banknote } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AccountingPageHeaderProps {
  pageTitle: string;
}

const accountingLinks = [
    { href: "/accounting/invoices/payments", icon: FileOutput, label: "Accounts Receivable" },
    { href: "/accounting/invoices/create", icon: FileDigit, label: "Invoice Generator" },
    { href: "/accounting/transactions/income", icon: TrendingUp, label: "Manage Income" },
    { href: "/accounting/transactions/expenses", icon: TrendingDown, label: "Manage Expenses" },
    { href: "/accounting/ledgers", icon: BookText, label: "General Ledger" },
    { href: "/accounting/accounts-payable", icon: FileInput, label: "Accounts Payable" },
    { href: "/accounting/bank-statements", icon: WalletCards, label: "Bank Statements" },
    { href: "/accounting/payroll", icon: Banknote, label: "Payroll" },
    { href: "/accounting/reports", icon: BarChart3, label: "Reporting Hub" },
    { href: "/accounting/vitals", icon: Activity, label: "Financial Vitals" },
    { href: "/accounting/onboarding", icon: UserPlus, label: "Client Onboarding" },
    { href: "/accounting/bks", icon: Info, label: "BKS" },
];


export function AccountingPageHeader({ pageTitle }: AccountingPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/accounting">Accounting Hub</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-2">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Quick Navigation <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {accountingLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href}>
                            <link.icon className="mr-2 h-4 w-4" />
                            {link.label}
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
        <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/accounting" aria-label="Return to Accounting Hub">
            <X className="h-5 w-5" />
            </Link>
        </Button>
      </div>
    </div>
  );
}
