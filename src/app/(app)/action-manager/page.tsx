
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardView = dynamic(
  () => import('@/components/dashboard/dashboard-view').then((mod) => mod.DashboardView),
  {
    ssr: false,
    loading: () => (
        <div className="p-4 sm:p-6 space-y-6">
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    ),
  }
);

export default function ActionManagerPage() {
  return <DashboardView />;
}
