
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { initializeFirebase } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingModal from "@/components/ui/loading-modal";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processRedirect = async () => {
      try {
        const { auth } = await initializeFirebase();
        const result = await getRedirectResult(auth);
        
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
             sessionStorage.setItem('google_access_token', credential.accessToken);
             const redirectPath = sessionStorage.getItem('google_auth_redirect') || "/google";
             sessionStorage.removeItem('google_auth_redirect');
             router.push(redirectPath);
          } else {
             router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
      } catch (error: any) {
        console.error("Authentication callback error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error.message || "An error occurred during authentication. Please try logging in again.",
        });
        setIsLoading(false); // Hide loading modal on error
        router.push("/login");
      }
    };
    processRedirect();
  }, [router, toast]);

  return isLoading ? <LoadingModal /> : null;
}
