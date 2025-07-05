
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  // This layout is now just a simple wrapper. The loading and redirect logic
  // is handled by the root layout and the app layout which check auth state.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
