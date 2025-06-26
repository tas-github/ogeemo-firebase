
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";

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
import { useNavigation } from "@/context/navigation-context";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isNavigating, setIsNavigating } = useNavigation();

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, setIsNavigating]);

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

        <div className="relative flex flex-1 flex-col overflow-auto">
          <header className="sticky top-0 z-10 flex shrink-0 items-center border-b bg-background/80 px-4 py-2 backdrop-blur-sm sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1 text-center">
              {pathname === '/sandbox' && <h1 className="text-xl font-semibold">Sandbox</h1>}
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
           {isNavigating && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
        </div>

      </div>
    </SidebarProvider>
  );
}
