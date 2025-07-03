
import { AccountingPageHeader } from "@/components/accounting/page-header";

export default function InvoiceTemplatesPage() {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full space-y-6">
      <AccountingPageHeader pageTitle="Invoice Templates" />
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Invoice Templates
        </h1>
        <p className="text-muted-foreground">
          Create and manage reusable templates for your invoices.
        </p>
      </header>
      <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-2xl text-muted-foreground">Coming Soon.</p>
      </div>
    </div>
  );
}
