
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const FilesView = dynamic(
  () => import('@/components/files/files-view').then((mod) => mod.FilesView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading File Manager...</p>
        </div>
      </div>
    ),
  }
);

export default function FilesPage() {
  return <FilesView />;
}
