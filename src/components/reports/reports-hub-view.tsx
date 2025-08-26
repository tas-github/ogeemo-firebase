"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Search,
  Clock,
  ArrowRight,
  UserCheck,
  Activity,
  Briefcase,
  ListTodo,
} from "lucide-react";

export function ReportsHubView() {
  const features = [
    {
      icon: Briefcase,
      title: "Project Manager",
      description: "Oversee all your high-level projects. Click a project to see its detailed task board.",
      href: "/projects",
      cta: "Go to Projects",
    },
     {
      icon: ListTodo,
      title: "Task & Event List",
      description: "View a comprehensive list of every task and event across all projects and your calendar.",
      href: "/tasks",
      cta: "View All Tasks",
    },
    {
      icon: Activity,
      title: "Activity Report",
      description: "A high-level overview of your workspace, including key metrics and recent activities.",
      cta: "View Activity",
      href: "/reports/activity",
    },
    {
      icon: FileText,
      title: "Templates",
      description: "Create, manage, and utilize standardized report templates for consistent and efficient reporting.",
      cta: "Manage Templates",
      href: "/reports/templates",
    },
    {
      icon: Search,
      title: "Advanced Search",
      description: "Perform deep, conditional searches across all your data to find exactly what you need.",
      cta: "Go to Advanced Search",
      href: "/reports/search",
    },
    {
      icon: Clock,
      title: "Billable Hours",
      description: "Generate detailed reports on billable hours logged against clients and projects.",
      cta: "Generate Hours Report",
      href: "/reports/billable-hours",
    },
    {
      icon: UserCheck,
      title: "Client Billing",
      description: "Generate an itemized report of time tracked for clients, including billable rates and totals.",
      cta: "View Billing Report",
      href: "/reports/client-billing",
    },
     {
      icon: FileText,
      title: "Business Activity Statement",
      description: "Generate a statement of business activities based on your income and expense ledger data.",
      cta: "View Statement",
      href: "/accounting/reports/t2125",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Reporting Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your central command for generating insights and exporting data from
          the Ogeemo platform.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <CardDescription>{feature.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={feature.href}>
                  {feature.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
