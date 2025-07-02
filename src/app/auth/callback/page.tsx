
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// This is a dedicated page to handle the redirect from Google's sign-in.
// Its sole purpose is to process the authentication result and redirect the user.
export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  useEffect(() => {
    // Only process if a sign-in was initiated from our app.
    if (sessionStorage.getItem('google_auth_in_progress') !== 'true') {
        router.push('/login');
        return;
    }
    
    sessionStorage.removeItem('google_auth_in_progress');

    const processRedirect = async () => {
      try {
        if (!auth) {
          throw new Error("Firebase auth object not available.");
        }
        
        const result = await getRedirectResult(auth);

        if (result) {
          // Success! The onAuthStateChanged listener in AuthContext will now have the user.
          router.push("/dashboard");
        } else {
          // This can happen if the page is reloaded or visited directly.
          // The auth state might already be handled. We redirect to dashboard as a safe fallback.
          // The ClientLayout will redirect to /login if there's still no user.
          router.push("/dashboard");
        }
      } catch (error: any) {
        console.error("Error during authentication callback:", error);
        if (error.code === 'auth/unauthorized-domain') {
            setUnauthorizedDomain(window.location.hostname);
        } else {
            toast({
              variant: "destructive",
              title: "Sign-In Failed",
              description: error.message || "An error occurred during authentication. Please try again.",
            });
            router.push("/login");
        }
      }
    };

    processRedirect();
  }, [router, toast]);

  if (unauthorizedDomain) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-2xl">
                 <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="font-bold">Authentication Failed: Domain Not Authorized</AlertTitle>
                    <AlertDescription className="space-y-4 mt-2">
                        <p>
                            Your app's domain <strong>{unauthorizedDomain}</strong> is not authorized to perform this action. To fix this, you must add it to your Firebase project's list of authorized domains.
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Firebase Console</a> and select your project.</li>
                            <li>In the left menu, go to <strong>Authentication</strong>, then click the <strong>Settings</strong> tab.</li>
                            <li>Scroll down to the <strong>Authorized domains</strong> section and click <strong>Add domain</strong>.</li>
                            <li>Enter the exact domain name shown above and click Add: <br />
                                <code className="bg-gray-700 text-white px-2 py-1 rounded-md mt-1 inline-block text-xs">{unauthorizedDomain}</code>
                            </li>
                        </ol>
                        <p>
                            After adding the domain, please <a href="/login" className="underline font-semibold">return to the login page</a> and try again.
                        </p>
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
  }

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
