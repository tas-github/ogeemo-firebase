"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";

export function MasterSearchView() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Master Search" />
      <div className="flex flex-col items-center">
        <header className="text-center mb-6 max-w-4xl">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Master Accounting Search
          </h1>
          <p className="text-muted-foreground">
            This is the starting point for the new master search feature.
          </p>
        </header>

        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Initiate Search</CardTitle>
                <CardDescription>
                    Click the button below to proceed with the master search functionality.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Button size="lg">
                    <Search className="mr-2 h-5 w-5" />
                    Master Search
                </Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
