
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const IncomeView = dynamic(
  () => import('@/components/accounting/income-view').then((mod) => mod.IncomeView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Income Manager...</p>
        </div>
      </div>
    ),
  }
);

export default function IncomePage() {
  return <IncomeView />;
}
