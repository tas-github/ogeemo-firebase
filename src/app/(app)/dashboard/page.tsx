
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton = () => (
    <div className="space-y-6 p-4 sm:p-6">
        <header className="text-center">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
        </header>
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
                 <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                 </div>
                 <Skeleton className="h-96 w-full" />
            </div>
            <div className="md:col-span-1">
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
    </div>
);


const DashboardView = dynamic(
  () => import('@/components/dashboard/dashboard-view').then((mod) => mod.DashboardView),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);


export default function DashboardPage() {
  return <DashboardView />;
}
