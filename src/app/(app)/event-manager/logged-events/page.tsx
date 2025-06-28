
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const LoggedEventsView = dynamic(
  () => import('@/components/event-manager/logged-events-view').then((mod) => mod.LoggedEventsView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Logged Events...</p>
        </div>
      </div>
    ),
  }
);

export default function LoggedEventsPage() {
  return <LoggedEventsView />;
}
