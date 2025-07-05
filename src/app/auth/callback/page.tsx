
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
          // Check if it was a sign-in or a link for more permissions
          if (credential?.accessToken) {
             sessionStorage.setItem('google_access_token', credential.accessToken);
             // If this was a linking action, redirect to the page that initiated it
             const redirectPath = sessionStorage.getItem('google_auth_redirect') || "/google";
             sessionStorage.removeItem('google_auth_redirect');
             router.push(redirectPath);
          } else {
             // This was a simple sign-in
             router.push("/dashboard");
          }
        } else {
          // No result likely means the user visited this page directly or was already signed in.
          // Let's safely redirect them to the dashboard.
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
