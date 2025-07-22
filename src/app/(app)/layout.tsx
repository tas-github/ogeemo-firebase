
"use client";

import { ClientLayout } from "@/components/layout/client-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <ClientLayout>
      {/*
        This layout has been temporarily simplified to the bare minimum
        to resolve a rendering issue. Components like the Sidebar and UserNav
        will be restored once the application is stable.
      */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </ClientLayout>
  );
}
