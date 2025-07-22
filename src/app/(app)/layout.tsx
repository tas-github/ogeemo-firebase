
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainMenu } from "@/components/layout/main-menu";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <div className="flex flex-col h-full">
            <div className="p-2 border-b">
               <Logo />
            </div>
            <div className="flex-1 overflow-y-auto">
                <MainMenu />
            </div>
            <div className="p-2 border-t">
               <UserNav />
            </div>
        </div>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 overflow-auto bg-muted/30">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
