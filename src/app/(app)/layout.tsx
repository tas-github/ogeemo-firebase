
"use client";

import { ClientLayout } from "@/components/layout/client-layout";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // The authentication check has been removed to allow direct access to the app
  // within the Firebase Studio development environment.
  return (
    <ClientLayout>
      <Sidebar />
      <main className="flex-1 min-w-0">
        <SidebarInset>{children}</SidebarInset>
      </main>
    </ClientLayout>
  );
}
