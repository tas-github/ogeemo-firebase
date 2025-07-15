
"use client";

import { ClientLayout } from "@/components/layout/client-layout";
import { MainMenu } from "@/components/layout/main-menu";
import { 
  Sidebar,
  SidebarContent, 
  SidebarFooter,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <ClientLayout>
      <Sidebar>
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
