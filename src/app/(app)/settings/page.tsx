
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const SettingsView = dynamic(
  () => import('@/components/settings/settings-view').then((mod) => mod.SettingsView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Settings...</p>
        </div>
      </div>
    ),
  }
);

export default function SettingsPage() {
  return <SettingsView />;
}
