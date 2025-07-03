
"use client";

import { usePathname, useRouter } from "next/navigation";
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
import { useAuth } from "@/context/auth-context";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If the auth state is done loading and there's no user,
    // redirect them to the login page.
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // While the auth state is loading, or if there's no user yet,
  // show a full-screen loader. This prevents a flash of the dashboard
  // for unauthenticated users.
  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
        </div>

      </div>
    </SidebarProvider>
  );
}
