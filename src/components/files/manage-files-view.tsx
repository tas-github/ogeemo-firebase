'use client';

import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

// This component now acts as a wrapper to dynamically load the main files view.
// This ensures a consistent UI and avoids code duplication.
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

export default function ManageFilesPage() {
  return <FilesView />;
}
