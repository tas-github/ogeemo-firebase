
"use client";

import { ClientLayout } from "@/components/layout/client-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
    </ClientLayout>
  );
}
