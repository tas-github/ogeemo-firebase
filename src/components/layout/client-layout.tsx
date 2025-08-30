
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { RouteChangeListener } from '../route-change-listener';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <RouteChangeListener />
      {children}
    </SidebarProvider>
  );
}
