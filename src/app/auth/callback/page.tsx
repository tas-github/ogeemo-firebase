
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const processRedirect = async () => {
      try {
        if (!auth) throw new Error("Firebase not initialized.");
        
        const result = await getRedirectResult(auth);
        
        if (result) {
          // Successfully signed in.
          // Get the access token from the credential.
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
             // Store the access token in session storage so the AuthContext can pick it up.
             sessionStorage.setItem('google_access_token', credential.accessToken);
          }
          
          router.push("/dashboard");
        } else {
          // This can happen if the page is visited directly or if the redirect result has already been used.
          // It's safe to just send them to login.
          router.push("/login");
        }
      } catch (error) {
        console.error("Authentication callback error:", error);
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
        Finalizing login, please wait...
      </p>
    </div>
  );
}
