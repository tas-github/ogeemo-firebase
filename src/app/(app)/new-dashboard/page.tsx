
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton = () => (
    <div className="space-y-6 p-4 sm:p-6">
        <header className="text-center">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="lg:col-span-4 h-96 w-full" />
            <Skeleton className="lg:col-span-3 h-96 w-full" />
        </div>
    </div>
);


const NewDashboardView = dynamic(
  () => import('@/components/dashboard/new-dashboard-view').then((mod) => mod.NewDashboardView),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);


export default function NewDashboardPage() {
  return <NewDashboardView />;
}
