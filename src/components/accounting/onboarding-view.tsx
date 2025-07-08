
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FilePlus2, Landmark, CreditCard, Wallet, Info, Plus, Trash2 } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const BUSINESS_INFO_KEY = "accountingOnboardingBusinessInfo";
const BANK_ACCOUNTS_KEY = "accountingBankAccounts";
const CREDIT_CARDS_KEY = "accountingCreditCards";
const CASH_ACCOUNT_KEY = "accountingCashAccount";

const expenseCategories = [
  "Advertising", "Car & Truck Expenses", "Commissions & Fees",
  "Contract Labor", "Depreciation", "Insurance", "Interest",
  "Legal & Professional Services", "Office Expense", "Rent or Lease",
  "Repairs & Maintenance", "Supplies", "Taxes & Licenses",
  "Travel", "Meals", "Utilities", "Wages"
];

interface BusinessInfo {
  name: string;
  address: string;
  ein: string;
  method: 'cash' | 'accrual';
}

export function OnboardingView() {
    const { toast } = useToast();
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({ name: '', address: '', ein: '', method: 'cash' });
    const [bankAccounts, setBankAccounts] = useState<string[]>([]);
    const [newBankAccount, setNewBankAccount] = useState("");
    const [creditCards, setCreditCards] = useState<string[]>([]);
    const [newCreditCard, setNewCreditCard] = useState("");
    const [cashAccount, setCashAccount] = useState("");

    useEffect(() => {
        try {
            const savedBusinessInfo = localStorage.getItem(BUSINESS_INFO_KEY);
            if (savedBusinessInfo) setBusinessInfo(JSON.parse(savedBusinessInfo));

            const savedBankAccounts = localStorage.getItem(BANK_ACCOUNTS_KEY);
            if (savedBankAccounts) setBankAccounts(JSON.parse(savedBankAccounts));
            
            const savedCreditCards = localStorage.getItem(CREDIT_CARDS_KEY);
            if (savedCreditCards) setCreditCards(JSON.parse(savedCreditCards));

            const savedCashAccount = localStorage.getItem(CASH_ACCOUNT_KEY);
            if (savedCashAccount) setCashAccount(JSON.parse(savedCashAccount));

        } catch (error) {
            console.error("Failed to load onboarding data from localStorage", error);
        }
    }, []);

    const handleSaveBusinessInfo = () => {
        try {
            localStorage.setItem(BUSINESS_INFO_KEY, JSON.stringify(businessInfo));
            toast({ title: "Business Information Saved" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not save business info." });
        }
    };

    const handleAccountListChange = (type: 'bank' | 'card', newList: string[]) => {
        try {
            if (type === 'bank') {
                setBankAccounts(newList);
                localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(newList));
            } else {
                setCreditCards(newList);
                localStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(newList));
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not update account list." });
        }
    };
    
    const handleCashAccountChange = (value: string) => {
        try {
            setCashAccount(value);
            localStorage.setItem(CASH_ACCOUNT_KEY, JSON.stringify(value));
        } catch (error) {
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not update cash account." });
        }
    };
    
    const handleAddAccount = (type: 'bank' | 'card') => {
        if (type === 'bank') {
            if (newBankAccount.trim()) {
                handleAccountListChange('bank', [...bankAccounts, newBankAccount.trim()]);
                setNewBankAccount("");
            }
        } else {
            if (newCreditCard.trim()) {
                handleAccountListChange('card', [...creditCards, newCreditCard.trim()]);
                setNewCreditCard("");
            }
        }
    };

    const handleDeleteAccount = (type: 'bank' | 'card', accountNameToDelete: string) => {
        if (type === 'bank') {
            handleAccountListChange('bank', bankAccounts.filter(acc => acc !== accountNameToDelete));
        } else {
            handleAccountListChange('card', creditCards.filter(acc => acc !== accountNameToDelete));
        }
    };

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
                        <Accordion type="single" collapsible defaultValue="item-1">
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
                                        
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-foreground">Business Information</h4>
                                            <div className="space-y-2">
                                                <Label htmlFor="biz-name">Business Name</Label>
                                                <Input id="biz-name" value={businessInfo.name} onChange={e => setBusinessInfo(p => ({...p, name: e.target.value}))} onBlur={handleSaveBusinessInfo} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="biz-address">Business Address</Label>
                                                <Input id="biz-address" value={businessInfo.address} onChange={e => setBusinessInfo(p => ({...p, address: e.target.value}))} onBlur={handleSaveBusinessInfo}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="biz-ein">Employer ID Number (EIN)</Label>
                                                <Input id="biz-ein" value={businessInfo.ein} onChange={e => setBusinessInfo(p => ({...p, ein: e.target.value}))} onBlur={handleSaveBusinessInfo}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="biz-method">Accounting Method</Label>
                                                <Select value={businessInfo.method} onValueChange={(value: 'cash' | 'accrual') => { setBusinessInfo(p => ({...p, method: value})); handleSaveBusinessInfo(); }}>
                                                    <SelectTrigger id="biz-method"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cash">Cash</SelectItem>
                                                        <SelectItem value="accrual">Accrual</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h4 className="font-semibold text-foreground">Financial Accounts</h4>
                                            <p className="text-sm text-muted-foreground mt-1">List all accounts used for business transactions.</p>
                                            <div className="mt-4 space-y-4">
                                                <Card className="bg-background">
                                                    <CardHeader className="p-3 pb-2 flex flex-row items-center gap-3">
                                                         <Landmark className="h-5 w-5 text-primary" />
                                                         <p className="font-semibold">Bank Accounts</p>
                                                    </CardHeader>
                                                    <CardContent className="p-3 space-y-2">
                                                        {bankAccounts.map(acc => (
                                                            <div key={acc} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                                <span className="text-sm">{acc}</span>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAccount('bank', acc)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center gap-2">
                                                            <Input placeholder="New bank account name..." value={newBankAccount} onChange={e => setNewBankAccount(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAccount('bank')} />
                                                            <Button size="sm" onClick={() => handleAddAccount('bank')}><Plus className="mr-1 h-4 w-4"/>Add</Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-background">
                                                    <CardHeader className="p-3 pb-2 flex flex-row items-center gap-3">
                                                         <CreditCard className="h-5 w-5 text-primary" />
                                                         <p className="font-semibold">Credit Cards</p>
                                                    </CardHeader>
                                                     <CardContent className="p-3 space-y-2">
                                                        {creditCards.map(acc => (
                                                            <div key={acc} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                                <span className="text-sm">{acc}</span>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAccount('card', acc)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center gap-2">
                                                            <Input placeholder="New credit card name..." value={newCreditCard} onChange={e => setNewCreditCard(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAccount('card')} />
                                                            <Button size="sm" onClick={() => handleAddAccount('card')}><Plus className="mr-1 h-4 w-4"/>Add</Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-background">
                                                    <CardHeader className="p-3 pb-2 flex flex-row items-center gap-3">
                                                         <Wallet className="h-5 w-5 text-primary" />
                                                         <p className="font-semibold">Cash Account</p>
                                                    </CardHeader>
                                                    <CardContent className="p-3">
                                                        <Input placeholder="e.g., Petty Cash" value={cashAccount} onChange={e => handleCashAccountChange(e.target.value)} />
                                                    </CardContent>
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
