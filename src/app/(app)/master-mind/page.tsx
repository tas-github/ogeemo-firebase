
'use client';

import { TimeManagerView } from '@/components/time/time-manager-view';
import { LoaderCircle } from 'lucide-react';

export default function MasterMindPage() {
  // The TimeManagerView component now handles its own data fetching.
  // We provide a loading fallback here.
  return <TimeManagerView />;
}
