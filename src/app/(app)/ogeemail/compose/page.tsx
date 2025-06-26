
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const ComposeEmailView = dynamic(
  () => import('@/components/ogeemail/compose-view').then((mod) => mod.ComposeEmailView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Composer...</p>
        </div>
      </div>
    ),
  }
);

export default function ComposeEmailPage() {
  return <ComposeEmailView />;
}
