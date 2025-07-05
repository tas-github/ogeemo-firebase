
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";

import { ClientLayout } from "@/components/layout/client-layout";
import { useAuth } from "@/context/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state is done loading and there's no user,
    // redirect to the login page.
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  // While the auth state is loading, or if there's no user yet (and we're about to redirect),
  // show a full-screen loader. This prevents a flash of the dashboard content.
  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}
