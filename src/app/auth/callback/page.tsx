
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { initializeFirebase } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const processRedirect = async () => {
      try {
        const { auth } = await initializeFirebase();
        const result = await getRedirectResult(auth);
        
        if (result) {
          // This was a successful sign-in or link.
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
             // An access token is present, meaning this was likely a linking operation
             // for additional scopes (e.g., from the Google integration page).
             sessionStorage.setItem('google_access_token', credential.accessToken);
             router.push("/google");
          } else {
             // No access token means it was a simple sign-in.
             router.push("/dashboard");
          }
        } else {
          // No result probably means the user is already signed in and just visited this page.
          // Safely redirect them to the dashboard.
          router.push("/dashboard");
        }
      } catch (error: any) {
        console.error("Authentication callback error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error.message || "An error occurred during authentication. Please try logging in again.",
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
        Finalizing login, please wait...
      </p>
    </div>
  );
}
