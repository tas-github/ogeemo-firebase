
import dynamic from 'next/dynamic';
import { ActionManagerSkeleton } from '@/components/action-manager/action-manager-skeleton';

const ActionManagerView = dynamic(
  () => import('@/components/action-manager/action-manager-view').then((mod) => mod.ActionManagerView),
  {
    ssr: false,
    loading: () => <ActionManagerSkeleton />,
  }
);

export default function ActionManagerPage() {
  return <ActionManagerView />;
}
