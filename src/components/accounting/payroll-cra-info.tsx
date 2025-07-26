
"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, ExternalLink, Calculator } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from 'next/link';

export function PayrollCraInfo() {
  const deductions = [
    {
      title: 'Canada Pension Plan (CPP)',
      description: "A mandatory contribution to provide pension and benefits to contributors and their families. Both employee and employer contribute."
    },
    {
      title: 'Employment Insurance (EI)',
      description: "Provides temporary income support to unemployed workers. Both employee and employer contribute."
    },
    {
      title: 'Income Tax',
      description: "Deducted from an employee's income and remitted to the federal and provincial/territorial governments."
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          CRA Payroll Info
        </CardTitle>
        <CardDescription>
          Key deductions required by the Canada Revenue Agency (CRA).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          {deductions.map((deduction, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger>{deduction.title}</AccordionTrigger>
              <AccordionContent>
                {deduction.description}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <div className="p-3 bg-muted/50 border rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Use the Official CRA Calculator</h4>
            <p className="text-xs text-muted-foreground mb-3">
                For accurate, up-to-date calculations, always use the official Payroll Deductions Online Calculator (PDOC) provided by the CRA.
            </p>
            <Button asChild size="sm" className="w-full">
                <a href="https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/payroll-deductions-online-calculator.html" target="_blank" rel="noopener noreferrer">
                    <Calculator className="mr-2 h-4 w-4"/>
                    Go to CRA Calculator
                    <ExternalLink className="ml-2 h-3 w-3"/>
                </a>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
