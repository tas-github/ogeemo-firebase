"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("CALLBACK_PAGE: Loaded. Now processing redirect result...");
    const processRedirect = async () => {
      try {
        if (!auth) {
          console.error("CALLBACK_PAGE: Firebase auth object not available.");
          toast({ variant: "destructive", title: "Fatal Error", description: "Firebase is not initialized." });
          router.push("/login");
          return;
        }
        
        const result = await getRedirectResult(auth);
        console.log("CALLBACK_PAGE: getRedirectResult returned:", result);

        if (result) {
          console.log("CALLBACK_PAGE: Success! User data received. Redirecting to /dashboard.");
          // The user object can be found in result.user
          console.log("CALLBACK_PAGE: User object:", result.user);
          router.push("/dashboard");
        } else {
          console.log("CALLBACK_PAGE: No redirect result found. This page may have been loaded directly. Redirecting to /login.");
          router.push("/login");
        }
      } catch (error) {
        console.error("CALLBACK_PAGE: Error during getRedirectResult:", error);
        toast({
          variant: "destructive",
          title: "Sign-In Failed",
          description: "An error occurred during authentication. Please try logging in again.",
        });
        router.push("/login");
      }
    };

    processRedirect();
  }, [router, toast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg font-medium text-foreground">
        Verifying authentication, please wait...
      </p>
    </div>
  );
}
