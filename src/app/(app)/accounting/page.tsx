
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AccountingHubSkeleton = () => (
    <div className="p-4 sm:p-6 space-y-6">
        <header className="text-center mb-6">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
            <Skeleton className="h-10 w-32 mx-auto mt-4" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto items-start">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    </div>
);


const AccountingHubView = dynamic(
  () => import('@/components/accounting/accounting-hub-view').then((mod) => mod.AccountingHubView),
  {
    ssr: false,
    loading: () => <AccountingHubSkeleton />,
  }
);

export default function AccountingHubPage() {
  return <AccountingHubView />;
}
