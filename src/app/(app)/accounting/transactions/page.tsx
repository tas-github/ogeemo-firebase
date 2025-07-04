
import { AccountingPageHeader } from "@/components/accounting/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TransactionsHubPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Transaction Hub" />
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Transaction Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your income, expenses, and transaction categorization from here.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Placeholder for buttons to be added next */}
        <Card>
          <CardHeader>
            <CardTitle>Awaiting Instructions</CardTitle>
            <CardDescription>
              Ready for the next step.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">The buttons for this hub will be added based on your next set of instructions.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
