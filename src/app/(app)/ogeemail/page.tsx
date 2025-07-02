
import dynamic from 'next/dynamic';
import { OgeeMailInboxSkeleton } from '@/components/ogeemail/inbox-skeleton';

const OgeeMailInboxView = dynamic(
  () => import('@/components/ogeemail/inbox-view').then((mod) => mod.OgeeMailInboxView),
  {
    ssr: false,
    loading: () => <OgeeMailInboxSkeleton />,
  }
);

export default function OgeeMailPage() {
  return <OgeeMailInboxView />;
}
