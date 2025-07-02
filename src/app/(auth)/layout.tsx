
"use client";

import type { ReactNode } from "react";

// This layout is a simple wrapper for the login and register pages.
// The previous logic has been removed to prevent conflicts with the new auth flow.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
