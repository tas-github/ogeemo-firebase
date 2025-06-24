
"use client";

import { usePathname } from "next/navigation";

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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

        <div className="flex flex-1 flex-col overflow-auto">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1 text-center">
                {pathname === '/sandbox' && <h1 className="text-xl font-semibold">Sandbox</h1>}
                </div>
            </header>
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>

      </div>
    </SidebarProvider>
  );
}
