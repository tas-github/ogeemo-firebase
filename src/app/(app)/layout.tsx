
'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MainMenu } from '@/components/layout/main-menu';
import { ClientLayout } from '@/components/layout/client-layout';
import { ActiveTimerIndicator } from '@/components/layout/active-timer-indicator';
import { Sidebar, SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { Search } from 'lucide-react';
import { UserNav } from '@/components/user-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DndProvider backend={HTML5Backend}>
      <ClientLayout>
        <div className="flex h-screen w-full bg-muted">
          {/* Sidebar */}
          <Sidebar className="hidden h-full w-56 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
            <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/20 px-4 lg:px-6">
              <Logo />
            </div>
            <div className="flex-1 overflow-y-auto pt-4">
              <MainMenu />
            </div>
          </Sidebar>
          
          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-16 items-center justify-between gap-4 bg-gradient-to-r from-glass-start to-glass-end px-4 md:px-6">
               <div className="flex items-center gap-4">
                 <SidebarTrigger className="md:hidden" />
               </div>
               <div className="relative flex-1">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]"
                />
              </div>
              <div className="flex items-center gap-4">
                <UserNav />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-background">
              <div className="p-4 md:p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
        <ActiveTimerIndicator />
      </ClientLayout>
    </DndProvider>
  );
}
