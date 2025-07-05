
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        if (!auth) {
          setIsVerifying(false);
          return;
        }

        // The getRedirectResult should be handled on a dedicated callback page
        // to avoid race conditions. This layout now just ensures the user sees a loading state
        // while the app figures out what's happening. The actual redirect result
        // is processed on /auth/callback.
        const result = await getRedirectResult(auth).catch(() => null);
        
        if (result) {
          // A user was successfully signed in on redirect.
          // It is now safe to redirect them to the dashboard.
          router.push("/dashboard");
        } else {
          // No redirect result, so the user is visiting the page normally.
          setIsVerifying(false);
        }
      } catch (error) {
        console.error("Error during sign-in redirect check:", error);
        toast({
          variant: "destructive",
          title: "Sign-In Failed",
          description: "An unexpected error occurred during sign-in. Please try again.",
        });
        setIsVerifying(false);
      }
    };

    checkRedirect();
  }, [router, toast]);

  if (isVerifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium text-foreground">
          Verifying authentication...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
