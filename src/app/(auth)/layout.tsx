
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="mb-6">
        <Logo />
       </div>
       <Card className="w-full max-w-sm">
         {children}
       </Card>
    </div>
  );
}
