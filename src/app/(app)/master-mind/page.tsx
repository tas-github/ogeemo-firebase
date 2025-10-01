
'use client';

import { TimeManagerView } from '@/components/time/time-manager-view';

export default function MasterMindPage() {
  // The TimeManagerView component now handles its own data fetching.
  // We provide a loading fallback here.
  return <TimeManagerView />;
}
