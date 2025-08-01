
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
import { ArrowRight, FileSpreadsheet } from "lucide-react";

export function ClientManagerView() {
  const features = [
    {
      icon: FileSpreadsheet,
      title: "Client Time Report",
      description: "Generate a detailed, filterable report of all time logged for a specific client.",
      href: "/reports/client-billing",
      cta: "Generate Report",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Client Manager Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This manager is now primarily for reporting. Time is logged via the Time Manager, and contacts are managed in the Contacts app.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
