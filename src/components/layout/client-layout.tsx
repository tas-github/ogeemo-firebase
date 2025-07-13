
"use client";

import {
  SidebarProvider,
} from "@/components/ui/sidebar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <div className="relative flex min-h-screen w-full flex-1">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
