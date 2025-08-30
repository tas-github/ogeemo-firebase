import Link from 'next/link';
import { MainMenu } from '@/components/layout/main-menu';
import { ClientLayout } from '@/components/layout/client-layout';
import { ActiveTimerIndicator } from '@/components/layout/active-timer-indicator';
import { Sidebar, SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LayoutDashboard } from 'lucide-react';
import { SidebarViewProvider } from '@/context/sidebar-view-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <SidebarViewProvider>
        <div className="flex h-screen w-full bg-muted">
          {/* Sidebar */}
          <Sidebar className="hidden h-full w-[16rem] flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
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
                 <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon" className="h-9 w-9 text-black hover:bg-white/20 hover:text-black">
                          <Link href="/action-manager">
                            <LayoutDashboard className="h-5 w-5" />
                            <span className="sr-only">Action Manager</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Action Manager</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
               </div>
               <div className="flex justify-center">
                  <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="outline" className="h-9 px-4">
                              <Link href="/command-centre">
                                  <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                      <span className="font-bold">OGEEMO</span>
                                  </div>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open Command Centre</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button asChild variant="outline" className="h-9 px-2">
                                  <Link href="https://gemini.google.com/app" target="_blank">
                                      <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                          <span className="font-bold">GEMINI</span>
                                      </div>
                                  </Link>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open Gemini</p>
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
      </SidebarViewProvider>
    </ClientLayout>
  );
}
