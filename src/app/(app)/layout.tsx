
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  FilePlus2,
  LayoutDashboard,
  Mail,
  Settings,
  Wand2,
  Beaker,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOgeeMailPage = pathname === '/ogeemail' || pathname === '/sandbox';

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* The Sidebar has been temporarily removed to debug a layout issue. */}
        {/* <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard")}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/action-manager")}
                  tooltip="Action Manager"
                >
                  <Link href="/action-manager">
                    <Wand2 />
                    <span>Action Manager</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/ogeemail")}
                  tooltip="OgeeMail"
                >
                  <Link href="/ogeemail">
                    <Mail />
                    <span>OgeeMail</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/sandbox")}
                  tooltip="Sandbox"
                >
                  <Link href="/sandbox">
                    <Beaker />
                    <span>Sandbox</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/data")}
                  tooltip="Data"
                >
                  <Link href="/data">
                    <Database />
                    <span>Data</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/forms")}
                  tooltip="Forms"
                >
                  <Link href="/forms">
                    <FilePlus2 />
                    <span>Forms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/settings")}
                  tooltip="Settings"
                >
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <UserNav />
          </SidebarFooter>
        </Sidebar> */}

        <main className="w-full flex flex-col min-h-0">
          <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <SidebarTrigger className="md:hidden" />
             <div className="flex-1 text-center">
              {pathname === '/ogeemail' && <h1 className="text-xl font-semibold">OgeeMail</h1>}
              {pathname === '/sandbox' && <h1 className="text-xl font-semibold">Sandbox Mail</h1>}
            </div>
          </header>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
