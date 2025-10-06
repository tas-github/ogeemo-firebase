
import { TimeManagerView } from '@/components/time/time-manager-view';
import { LoaderCircle } from 'lucide-react';
import { Suspense } from 'react';

export default function MasterMindPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Manager...</p>
        </div>
      </div>
    }>
      <TimeManagerView />
    </Suspense>
  );
}
