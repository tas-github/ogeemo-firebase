
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const T2125View = dynamic(
  () => import('@/components/accounting/t2125-view').then((mod) => mod.T2125View),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading T2125 Form...</p>
        </div>
      </div>
    ),
  }
);

export default function T2125Page() {
  return <T2125View />;
}
