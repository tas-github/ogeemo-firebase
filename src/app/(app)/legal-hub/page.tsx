
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const LegalHubView = dynamic(
  () => import('@/components/legal-hub/legal-hub-view').then((mod) => mod.LegalHubView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Legal Hub...</p>
        </div>
      </div>
    ),
  }
);

export default function LegalHubPage() {
  return <LegalHubView />;
}
