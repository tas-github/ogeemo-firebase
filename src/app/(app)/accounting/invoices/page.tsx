
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus, ArrowRight } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";

export default function InvoicesHubPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Invoice Manager" />
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Invoice Manager
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create, manage, and track client invoices from here.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FilePlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Create New Invoice</CardTitle>
                <CardDescription>
                  Generate a new invoice from logged activities or manual entries.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1" />
          <div className="p-6 pt-0">
            <Button asChild className="w-full">
              <Link href="/accounting/invoices/create">
                Create Invoice
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
        
        <Card className="flex flex-col items-center justify-center border-2 border-dashed bg-muted/50">
          <CardHeader className="text-center">
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              A list of recently created invoices will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming Soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
