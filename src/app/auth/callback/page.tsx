"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { initializeFirebase } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import LoadingModal from "@/components/ui/loading-modal";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Finalizing authentication...");

  useEffect(() => {
    const processRedirect = async () => {
      try {
        const { auth } = await initializeFirebase();
        const result = await getRedirectResult(auth);
        
        if (result) {
          // The AuthProvider will handle storing the token and redirecting.
          // We just need to wait for it to process. A simple redirect to a known
          // authenticated page is sufficient to trigger the AuthProvider's logic.
          router.push("/action-manager");
        } else {
          // If there's no result, it might be a direct navigation. Send to a safe default.
          router.push("/action-manager");
        }
      } catch (error: any) {
        console.error("Authentication callback error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error.message || "An error occurred during authentication. Please try logging in again.",
        });
        setIsLoading(false);
        router.push("/login");
      }
    };
    processRedirect();
  }, [router, toast, searchParams]);

  return isLoading ? <LoadingModal message={message} /> : null;
}
