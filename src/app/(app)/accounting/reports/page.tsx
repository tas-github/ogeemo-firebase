
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ReportsSkeleton = () => (
    <div className="p-4 sm:p-6 space-y-6">
        <header className="text-center mb-6">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
        </header>
        <div className="w-full max-w-2xl mx-auto space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
    </div>
);


const ReportsView = dynamic(
  () => import('@/components/accounting/reports-view').then((mod) => mod.ReportsView),
  {
    ssr: false,
    loading: () => <ReportsSkeleton />,
  }
);

export default function ReportsPage() {
  return <ReportsView />;
}
