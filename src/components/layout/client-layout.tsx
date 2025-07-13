
"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { MainMenu } from "@/components/layout/main-menu";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <MainMenu />
          </SidebarContent>
          <SidebarFooter>
            <UserNav />
          </SidebarFooter>
        </Sidebar>

        <div className="relative flex flex-1 flex-col overflow-auto min-w-0">
          <header className="sticky top-0 z-10 flex shrink-0 items-center border-b bg-background/80 px-4 py-2 backdrop-blur-sm sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1 text-center" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>

      </div>
    </SidebarProvider>
  );
}
