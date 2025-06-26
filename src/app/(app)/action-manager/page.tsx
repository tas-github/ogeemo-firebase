
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';
import { ActionManagerSkeleton } from '@/components/action-manager/action-manager-skeleton';

const ActionManagerView = dynamic(
  () => import('@/components/action-manager/action-manager-view').then((mod) => mod.ActionManagerView),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-full w-full">
        <ActionManagerSkeleton />
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-2xl">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            <p className="font-semibold text-card-foreground">Loading Action Manager...</p>
          </div>
        </div>
      </div>
    ),
  }
);

export default function ActionManagerPage() {
  return <ActionManagerView />;
}
