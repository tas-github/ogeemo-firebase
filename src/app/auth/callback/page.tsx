
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";

// This is a dedicated page to handle the redirect from Google's sign-in.
// Its sole purpose is to process the authentication result and redirect the user.
export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const processRedirect = async () => {
      try {
        if (!auth) {
          throw new Error("Firebase auth object not available.");
        }
        
        // This function processes the redirect result.
        const result = await getRedirectResult(auth);

        // If 'result' is not null, the user has successfully signed in.
        if (result) {
          // The onAuthStateChanged listener in our AuthContext will now have the user,
          // so we can safely redirect to the main application.
          router.push("/dashboard");
        } else {
          // If 'result' is null, it might mean the page was loaded directly
          // or the auth state was already handled. We redirect to login
          // as a safe fallback.
          router.push("/login");
        }
      } catch (error: any) {
        console.error("Error during authentication callback:", error);
        toast({
          variant: "destructive",
          title: "Sign-In Failed",
          description: error.message || "An error occurred during authentication. Please try again.",
        });
        router.push("/login");
      }
    };

    processRedirect();
  }, [router, toast]);

  // Display a loading indicator while the redirect is being processed.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg font-medium text-foreground">
        Finalizing authentication, please wait...
      </p>
    </div>
  );
}
