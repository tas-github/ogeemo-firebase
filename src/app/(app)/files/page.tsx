
import dynamic from 'next/dynamic';
import { FilesSkeleton } from '@/components/files/files-skeleton';

const FilesView = dynamic(
  () => import('@/components/files/files-view').then((mod) => mod.FilesView),
  {
    ssr: false,
    loading: () => <FilesSkeleton />,
  }
);

export default function FilesPage() {
  return <FilesView />;
}
