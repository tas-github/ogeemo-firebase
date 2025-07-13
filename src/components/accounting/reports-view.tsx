"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { User, Landmark, ShieldCheck } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";

export function ReportsView() {
  const reportViews = [
    {
      value: "item-1",
      icon: User,
      title: "Owner's View",
      description: "Key questions a business owner needs answered at a glance.",
      questions: [
        "What is my current cash position?",
        "How profitable are we? (Profit & Loss)",
        "Who owes me money? (Accounts Receivable)",
        "Who do I owe money to? (Accounts Payable)",
        "How are my sales trending over time?",
      ],
    },
    {
      value: "item-2",
      icon: Landmark,
      title: "Banker's View",
      description: "The essential financial statements for credit analysis and loans.",
      questions: [
        "What is the company's net worth? (Balance Sheet)",
        "How much debt does the company have? (Debt-to-Equity Ratio)",
        "Is the company generating enough cash? (Cash Flow Statement)",
        "What are the company's major sources of revenue and expenses? (Income Statement)",
      ],
    },
    {
      value: "item-3",
      icon: ShieldCheck,
      title: "Tax Auditor's View",
      description: "Detailed records required for tax preparation and audits.",
      questions: [
        "Detailed General Ledger for all accounts",
        "Complete list of all income transactions, with sources",
        "Comprehensive list of all expense transactions, with categories and receipts",
        "Payroll reports and records",
        "Records of major asset purchases and sales for depreciation",
      ],
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Reporting Hub" />
      <div className="flex flex-col items-center">
        <header className="text-center mb-6 max-w-4xl">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Reporting Hub
          </h1>
          <p className="text-muted-foreground">
            Generate and view reports tailored for any audience. Each view focuses on the key information different stakeholders need to know.
          </p>
        </header>

        <div className="w-full max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {reportViews.map((view) => (
              <AccordionItem key={view.value} value={view.value}>
                <AccordionTrigger>
                  <div className="flex items-center gap-4">
                    <view.icon className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">{view.title}</p>
                      <p className="text-sm font-normal text-muted-foreground">{view.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-12 pr-4">
                    <ul className="list-disc space-y-2">
                      {view.questions.map((question, index) => (
                        <li key={index}>{question}</li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
