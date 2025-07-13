
"use client";

import { ClientLayout } from "@/components/layout/client-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // The authentication check has been removed to allow direct access to the app
  // within the Firebase Studio development environment.
  return (
    <ClientLayout>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </ClientLayout>
  );
}
