
"use client";

import { ClientLayout } from "@/components/layout/client-layout";
import { Sidebar } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </ClientLayout>
  );
}
