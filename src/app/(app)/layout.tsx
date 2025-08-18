
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MainMenu } from '@/components/layout/main-menu';
import { ClientLayout } from '@/components/layout/client-layout';
import { ActiveTimerIndicator } from '@/components/layout/active-timer-indicator';
import { Sidebar, SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { GlobalSearch } from '@/components/layout/global-search';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);

  return (
    <ClientLayout>
      <div className="flex h-screen w-full bg-muted">
        {/* Sidebar */}
        <Sidebar className="hidden h-full flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
          <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/20 px-4 lg:px-6">
            <Logo />
          </div>
          <div className="flex-1 overflow-y-auto pt-4">
            <MainMenu />
          </div>
        </Sidebar>
        
        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between gap-4 bg-gradient-to-r from-[#3DD5C0] to-[#1E8E86] px-4 md:px-6">
             <div className="flex items-center gap-4">
               <SidebarTrigger className="md:hidden" />
             </div>
             <div className="flex flex-1 justify-center">
                <div className="flex items-center gap-2 max-w-2xl w-full">
                    <GlobalSearch isOpen={isCommandCenterOpen} onOpenChange={setIsCommandCenterOpen} />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="outline" size="icon" className="h-10 w-10 rounded-full flex-shrink-0" onClick={() => setIsCommandCenterOpen(true)}>
                                <Mic className="h-5 w-5" />
                                <span className="sr-only">Open Command Center with Mic</span>
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Voice Command</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button asChild variant="outline" className="h-9 px-2 flex-shrink-0">
                                <Link href="https://gemini.google.com/app" target="_blank">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">OGEEMO Ai</span>
                                    </div>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open Ogeemo Ai</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            <div className="flex items-center gap-4">
              <UserNav />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-background">
              {children}
          </main>
        </div>
      </div>
      <ActiveTimerIndicator />
    </ClientLayout>
  );
}
