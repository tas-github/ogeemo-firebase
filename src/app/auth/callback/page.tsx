
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { initializeFirebase } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingModal from "@/components/ui/loading-modal";
import { getGoogleAccessToken } from "@/services/google-service";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Finalizing authentication...");

  useEffect(() => {
    const processRedirect = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const storedState = sessionStorage.getItem('google_auth_state');
      
      try {
        // Handle Google Drive OAuth flow
        if (code && state && storedState && state === storedState) {
            sessionStorage.removeItem('google_auth_state');
            setMessage("Connecting to Google Drive...");

            try {
                const { accessToken } = await getGoogleAccessToken(code);
                sessionStorage.setItem('google_drive_access_token', accessToken);
                const redirectPath = sessionStorage.getItem('google_auth_redirect') || "/files";
                sessionStorage.removeItem('google_auth_redirect');
                router.push(redirectPath);
            } catch(e: any) {
                 toast({ variant: "destructive", title: "Connection Failed", description: `Could not connect to Google Drive: ${e.message}` });
                 router.push('/files');
            }

        // Handle Firebase Auth redirect flow
        } else {
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
                 router.push("/action-manager");
              }
            } else {
              // If there's no result, it might be a direct navigation. Send to a safe default.
              router.push("/action-manager");
            }
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
  }, [router, toast, searchParams]);

  return isLoading ? <LoadingModal message={message} /> : null;
}
