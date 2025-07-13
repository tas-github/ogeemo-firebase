"use client";

import { ClientLayout } from "@/components/layout/client-layout";
import { Sidebar } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <Sidebar />
      <div className="flex-1 overflow-auto">{children}</div>
    </ClientLayout>
  );
}
