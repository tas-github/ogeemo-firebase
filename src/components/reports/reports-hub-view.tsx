"use client";

import * as React from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileText,
  Search,
  Clock,
  Users,
  Calendar as CalendarIcon,
  ArrowRight,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportsHubView() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const features = [
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
      icon: FileSpreadsheet,
      title: "T2125 Tax Form",
      description: "Generate a mock-up of your T2125 Statement of Business Activities based on your ledger data.",
      cta: "View T2125 Form",
      href: "/reports/t2125",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Reports Manager
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
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                        <feature.icon className="h-6 w-6 text-orange-500" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <CardDescription>{feature.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Link href={feature.href}>
                  {feature.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}

        <Card className="md:col-span-3 lg:col-span-3 flex flex-col sm:flex-row items-start sm:items-center">
            <CardHeader className="flex-1">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Users className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <CardTitle>Client Entries Report</CardTitle>
                        <CardDescription>Generate a detailed report of all client-related entries within a specific date range.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="w-full sm:w-auto p-6 pt-0 sm:pt-6 sm:pl-0 flex flex-col sm:flex-row items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-[300px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
                <Button asChild className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                  <Link href="/reports/client-entries">
                    View Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
