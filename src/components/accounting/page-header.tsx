
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, ChevronDown, FileOutput, FileDigit, TrendingUp, TrendingDown, BookText, FileInput, WalletCards, BarChart3, Activity, UserPlus, Info, Banknote, ShieldCheck, FileText, ListPlus } from 'lucide-react';
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
  hubPath?: '/accounting' | '/accounting/bks';
  hubLabel?: string;
}

const accountingLinks = [
    { href: "/accounting/invoices/create", icon: FileDigit, label: "Create Invoice" },
    { href: "/accounting/accounts-receivable", icon: FileOutput, label: "Accounts Receivable" },
    { href: "/accounting/invoice-items", icon: ListPlus, label: "Manage Invoice Items" },
    { href: "/accounting/ledgers?tab=income", icon: TrendingUp, label: "Manage Income" },
    { href: "/accounting/ledgers?tab=expenses", icon: TrendingDown, label: "Manage Expenses" },
    { href: "/accounting/ledgers", icon: BookText, label: "General Ledger" },
    { href: "/accounting/reports/t2125", icon: FileText, label: "Business Activity Statement"},
    { href: "/accounting/accounts-payable", icon: FileInput, label: "Accounts Payable" },
    { href: "/accounting/bank-statements", icon: WalletCards, label: "Bank Statements" },
    { href: "/accounting/payroll", icon: Banknote, label: "Payroll" },
    { href: "/accounting/reports", icon: BarChart3, label: "Reporting Hub" },
    { href: "/accounting/tax", icon: ShieldCheck, label: "Tax Center" },
    { href: "/accounting/vitals", icon: Activity, label: "Financial Vitals" },
    { href: "/accounting/onboarding", icon: UserPlus, label: "Client Onboarding" },
    { href: "/accounting/bks", icon: Info, label: "BKS Welcome" },
];


export function AccountingPageHeader({ pageTitle, hubPath = '/accounting', hubLabel: hubLabelProp }: AccountingPageHeaderProps) {
  const defaultHubLabel = hubPath === '/accounting/bks' ? 'BKS Welcome' : 'Accounting Tools';
  const hubLabel = hubLabelProp || defaultHubLabel;
  
  return (
    <div className="flex items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={hubPath}>{hubLabel}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-2">
         <Button asChild>
            <Link href={hubPath}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {hubLabel}
            </Link>
         </Button>
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
      </div>
    </div>
  );
}
