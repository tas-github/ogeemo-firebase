
"use client";

import { ClientLayout } from "@/components/layout/client-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // The authentication check has been removed to allow direct access to the app
  // within the Firebase Studio development environment.
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}
