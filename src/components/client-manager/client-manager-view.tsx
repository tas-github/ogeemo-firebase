
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
import { Pencil, BookOpen, ArrowRight } from "lucide-react";

export function ClientManagerView() {
  const features = [
    {
      icon: Pencil,
      title: "Create New Log Entry",
      description: "Start the timer and create a detailed log for a new client action or event.",
      href: "/client-manager/create",
      cta: "Create Entry",
    },
    {
      icon: BookOpen,
      title: "View Client Log",
      description: "Review, search, and export your complete history of all client events.",
      href: "/client-manager/logged-events",
      cta: "View Log",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Client Manager Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          The purpose of this manager is to have a record of all actions recorded in the event manager, to create a history so that when a client gets an invoice and questions what you did for them, there is a readily available report to print or email to them. It will show both billable and non billable actions performed for the client.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
