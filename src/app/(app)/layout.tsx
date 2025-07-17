
"use client";

import { ClientLayout } from "@/components/layout/client-layout";
import { MainMenu } from "@/components/layout/main-menu";
import { Logo } from "@/components/logo";
import { 
  Sidebar,
  SidebarContent, 
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <ClientLayout>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Logo width={48} height={48} />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-primary">Ogeemo</h1>
              <p className="text-xs font-bold text-muted-foreground">AI-powered Business Management</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainMenu />
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 overflow-auto">{children}</div>
    </ClientLayout>
  );
}
