
import { DollarSign } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";

export default function EquityAccountPage() {
  return (
    <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full space-y-6">
       <AccountingPageHeader pageTitle="Equity Account" />
       <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
          <DollarSign className="h-8 w-8" />
          Equity Account
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
          Manage owner's contributions, draws, and retained earnings.
        </p>
      </header>
       <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed w-full max-w-4xl">
        <p className="text-2xl text-muted-foreground">Coming Soon.</p>
      </div>
    </div>
  );
}
