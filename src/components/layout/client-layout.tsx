
'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SidebarProvider } from '@/components/ui/sidebar';
import { RouteChangeListener } from '../route-change-listener';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DndProvider backend={HTML5Backend}>
      <SidebarProvider>
        <RouteChangeListener />
        {children}
      </SidebarProvider>
    </DndProvider>
  );
}
