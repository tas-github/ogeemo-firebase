
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLoading } from '@/context/loading-context';

export function RouteChangeListener() {
  const pathname = usePathname();
  const { hideLoading } = useLoading();

  useEffect(() => {
    // This effect runs on every navigation change.
    hideLoading();
  }, [pathname, hideLoading]);

  // This component renders nothing to the DOM.
  return null;
}
