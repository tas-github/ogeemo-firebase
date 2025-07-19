
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Banknote, FileText, Clock, Calculator, UserCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AccountingPageHeader } from "./page-header";

const FeatureDetail = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <AccordionItem value={title}>
    <AccordionTrigger>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold">{title}</span>
      </div>
    </AccordionTrigger>
    <AccordionContent>
      <div className="prose prose-sm dark:prose-invert max-w-none pl-8">
        {children}
      </div>
    </AccordionContent>
  </AccordionItem>
);

export function PayrollView() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
       <AccountingPageHeader pageTitle="Payroll" />
       <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
          <Banknote className="h-8 w-8" />
          Payroll Manager
        </h1>
        <p className="text-muted-foreground max-w-3xl mx-auto mt-2">
          A future-proof hub for managing employee compensation, from calculating pay and deductions to generating pay stubs and tax forms.
        </p>
      </header>
      
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Core Features (Coming Soon)</CardTitle>
                <CardDescription>Streamline your entire payroll process with these integrated tools.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue="Payroll Processing">
                    <FeatureDetail title="Payroll Processing" icon={Calculator}>
                        <ul>
                            <li><strong>Automated Calculations:</strong> Automatically calculate gross pay, deductions (like taxes, CPP, EI), and net pay based on employee salaries or hourly rates from the <strong>Time Manager</strong>.</li>
                            <li><strong>Direct Deposit:</strong> (Future) Securely pay your employees via direct deposit integration.</li>
                            <li><strong>Pay Stubs:</strong> Generate and distribute clear, professional pay stubs to your employees.</li>
                        </ul>
                    </FeatureDetail>
                    <FeatureDetail title="Tax & Remittance Management" icon={FileText}>
                        <ul>
                            <li><strong>Source Deductions:</strong> Automatically track federal and provincial tax deductions, as well as CPP and EI contributions.</li>
                            <li><strong>Remittance Summaries:</strong> Generate reports that tell you exactly how much to remit to the Canada Revenue Agency (CRA) each pay period.</li>
                            <li><strong>Year-End Forms:</strong> (Future) Simplify tax season by generating T4 slips for your employees.</li>
                        </ul>
                    </FeatureDetail>
                </Accordion>
            </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
            <CardHeader>
                <CardTitle>Integration with Ogeemo</CardTitle>
                <CardDescription>Payroll works seamlessly with other managers to eliminate duplicate data entry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg mt-1">
                        <UserCheck className="h-5 w-5 text-primary"/>
                    </div>
                    <div>
                        <h4 className="font-semibold">HR Manager</h4>
                        <p className="text-sm text-muted-foreground">Employee salary information, start dates, and banking details from the HR Manager will be used to set up payroll, ensuring accuracy.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg mt-1">
                        <Clock className="h-5 w-5 text-primary"/>
                    </div>
                    <div>
                        <h4 className="font-semibold">Time Manager</h4>
                        <p className="text-sm text-muted-foreground">Approved timesheets for hourly employees will automatically flow into the payroll run, guaranteeing that everyone is paid correctly for the hours they worked.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg mt-1">
                        <Calculator className="h-5 w-5 text-primary"/>
                    </div>
                    <div>
                        <h4 className="font-semibold">Accounting Hub</h4>
                        <p className="text-sm text-muted-foreground">After each payroll run, a corresponding expense entry will be automatically created in your <strong>General Ledger</strong>, keeping your financial statements accurate and up-to-date with labor costs.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
