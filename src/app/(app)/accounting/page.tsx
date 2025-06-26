
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const AccountingHubView = dynamic(
  () => import('@/components/accounting/accounting-hub-view').then((mod) => mod.AccountingHubView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Accounting Hub...</p>
        </div>
      </div>
    ),
  }
);

export default function AccountingHubPage() {
  return <AccountingHubView />;
}
