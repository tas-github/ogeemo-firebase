
'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MainMenu } from '@/components/layout/main-menu';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { ClientLayout } from '@/components/layout/client-layout';
import { ActiveTimerIndicator } from '@/components/layout/active-timer-indicator';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DndProvider backend={HTML5Backend}>
      <ClientLayout>
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <MainMenu />
          </SidebarContent>
          <SidebarHeader>
            <UserNav />
          </SidebarHeader>
        </Sidebar>
        <main className="flex-1 relative">
          {children}
          <ActiveTimerIndicator />
        </main>
      </ClientLayout>
    </DndProvider>
  );
}
