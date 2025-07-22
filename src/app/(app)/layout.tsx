
'use client';

import { MainMenu } from '@/components/layout/main-menu';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { ClientLayout } from '@/components/layout/client-layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
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
      <main className="flex-1">{children}</main>
    </ClientLayout>
  );
}
