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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    ChevronDown, 
    PlusCircle, 
    TrendingUp, 
    TrendingDown, 
    BookText,
    Receipt,
    FileOutput,
    FileDigit,
    UserPlus,
    Info,
    WalletCards,
    Activity,
    BarChart3,
    FileInput,
    Package,
    Landmark,
    Search
} from "lucide-react";

interface ActionItem {
    href: string;
    icon: React.ElementType;
    label: string;
}

const actionItems: ActionItem[] = [
    { href: "/accounting/invoices/create", icon: PlusCircle, label: "Create New Invoice" },
    { href: "/accounting/transactions/income", icon: TrendingUp, label: "Add Income Transaction" },
    { href: "/accounting/transactions/expenses", icon: TrendingDown, label: "Add Expense Transaction" },
    { href: "/accounting/accounts-receivable", icon: FileOutput, label: "View Accounts Receivable" },
    { href: "/accounting/ledgers", icon: BookText, label: "View General Ledger" },
    { href: "/accounting/bks-info", icon: Info, label: "BKS Info" },
];

interface FeatureLink {
    href: string;
    icon: React.ElementType;
    title: string;
    description: string;
}

const clientBillingFeatures: FeatureLink[] = [
    { href: "/accounting/accounts-receivable", icon: FileOutput, title: "Accounts Receivable", description: "Track money owed to you by clients." },
    { href: "/accounting/invoices/create", icon: FileDigit, title: "Invoice Generator", description: "Create new invoices and manage templates." },
];

const bookkeepingFeatures: FeatureLink[] = [
    { href: "/accounting/transactions/income", icon: TrendingUp, title: "Manage Income", description: "Record and categorize all incoming revenue." },
    { href: "/accounting/transactions/expenses", icon: TrendingDown, title: "Manage Expenses", description: "Track and classify all business expenditures." },
    { href: "/accounting/ledgers", icon: BookText, title: "General Ledger", description: "View a unified list of all transactions." },
];

const advancedFeatures: FeatureLink[] = [
    { href: "/accounting/accounts-payable", icon: FileInput, title: "Accounts Payable", description: "Track money you owe to vendors." },
    { href: "/accounting/asset-management", icon: Package, title: "Asset Management", description: "Manage capital assets and depreciation." },
    { href: "/accounting/bank-statements", icon: WalletCards, title: "Bank Statements", description: "Reconcile bank transactions." },
    { href: "/accounting/tax", icon: Landmark, title: "Tax Account", description: "Manage and track tax payments." },
    { href: "/accounting/reports", icon: BarChart3, title: "Reporting Hub", description: "Generate financial reports." },
    { href: "/accounting/vitals", icon: Activity, title: "Financial Vitals", description: "See key financial metrics at a glance." },
];

const setupFeatures: FeatureLink[] = [
    { href: "/accounting/onboarding", icon: UserPlus, title: "Client Onboarding", description: "Set up new clients and their accounts." },
    { href: "/accounting/bks-info", icon: Info, title: "Bookkeeping Kept Simple", description: "Learn our simple bookkeeping philosophy." },
]

export function AccountingHubView() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          New World Accounting Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your central command for a common-sense approach to finance. Select a feature or use the actions dropdown.
        </p>
         <div className="mt-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        Action Items <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {actionItems.map((item, index) => (
                         <DropdownMenuItem key={index} asChild>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto items-start">
        {/* Client & Billing Management */}
        <Card>
            <CardHeader>
                <CardTitle>Client & Billing Management</CardTitle>
                <CardDescription>Handle all client-facing financial tasks, from invoicing to receiving payments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {clientBillingFeatures.map(feature => (
                    <Link key={feature.href} href={feature.href} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                        <feature.icon className="h-8 w-8 text-primary shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold">{feature.title}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
        
        {/* Daily Bookkeeping */}
        <Card>
            <CardHeader>
                <CardTitle>Daily Bookkeeping</CardTitle>
                <CardDescription>Core day-to-day financial recording and transaction management.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {bookkeepingFeatures.map(feature => (
                    <Link key={feature.href} href={feature.href} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                        <feature.icon className="h-8 w-8 text-primary shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold">{feature.title}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>

        {/* Advanced & Reporting */}
        <Card>
            <CardHeader>
                <CardTitle>Advanced & Reporting</CardTitle>
                <CardDescription>Deeper financial tools for analysis, reconciliation, and reporting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {advancedFeatures.map(feature => (
                    <Link key={feature.href} href={feature.href} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                        <feature.icon className="h-8 w-8 text-primary shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold">{feature.title}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
        
        {/* Setup & Information */}
        <Card>
            <CardHeader>
                <CardTitle>Setup & Information</CardTitle>
                <CardDescription>Initial setup and informational resources for the accounting module.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {setupFeatures.map(feature => (
                    <Link key={feature.href} href={feature.href} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                        <feature.icon className="h-8 w-8 text-primary shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold">{feature.title}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
