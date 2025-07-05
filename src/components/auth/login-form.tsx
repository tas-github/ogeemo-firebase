
"use client";

import { useState } from "react";
import { signInWithRedirect } from "firebase/auth";
import { LoaderCircle } from "lucide-react";

import { auth, provider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 mr-2">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.229-11.303-7.582l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.447-2.274 4.481-4.244 5.892l6.19 5.238C42.012 35.245 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
    )
}

export function LoginForm() {
  const { toast } = useToast();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    if (!auth || !provider) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Authentication service not ready. Please try again.",
      });
      setIsGoogleSigningIn(false);
      return;
    }

    try {
      await signInWithRedirect(auth, provider);
      // The user will be redirected to Google, and then to our /auth/callback page.
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let description = "Could not initiate Google Sign-In. Please check the console for errors.";
      if (error.code === 'auth/operation-not-allowed') {
        description = "Google Sign-In is not enabled for this project. Please enable it in your Firebase console under Authentication > Sign-in method.";
      }
      if (error.code === 'auth/unauthorized-domain') {
        description = "This domain is not authorized for OAuth operations. Please add localhost to the authorized domains in your Firebase console's Authentication settings.";
      }
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: description,
      });
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <>
      <Button
        className="w-full bg-[#4285F4] text-white hover:bg-[#4285F4]/90"
        onClick={handleGoogleSignIn}
        disabled={isGoogleSigningIn}
      >
        {isGoogleSigningIn ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Sign in with Google
      </Button>

      <Dialog open={isGoogleSigningIn}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="sr-only">Signing In with Google</DialogTitle>
            <DialogDescription className="sr-only">
              Please wait while we are redirecting you to Google for authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-8">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Redirecting to Google...</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
