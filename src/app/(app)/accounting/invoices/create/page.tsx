
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const InvoiceGeneratorView = dynamic(
  () => import('@/components/accounting/invoice-generator-view').then((mod) => mod.InvoiceGeneratorView),
  {
    ssr: false, // This view relies on localStorage which is client-side only
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Invoice Generator...</p>
        </div>
      </div>
    ),
  }
);

export default function CreateInvoicePage() {
  return <InvoiceGeneratorView />;
}
