
"use client";

import { useState } from "react";
import Link from 'next/link';
import { signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { LoaderCircle } from "lucide-react";

import { initializeFirebase } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 mr-2">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.229-11.303-7.582l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.447-2.274 4.481-4.244 5.892l6.19 5.238C42.012 35.245 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
    )
}

export default function LoginPage() {
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // The initializeFirebase() promise ensures the SDK is ready.
      const { auth } = await initializeFirebase();
      const provider = new GoogleAuthProvider();
      // Use redirect flow which is more robust and recommended for most browsers.
      await signInWithRedirect(auth, provider);
      // The user will be redirected to the Google sign-in page,
      // and then back to the /auth/callback page.
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let description = `An unknown error occurred. Please check the console for details. (Code: ${error.code})`;
      if (error.code === 'auth/unauthorized-domain') {
          description = `This domain (${window.location.hostname}) is not authorized for OAuth operations. Please add it to the authorized domains in your Firebase console's authentication settings.`;
      }
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: description,
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline font-semibold">Welcome to Ogeemo</CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
            {isGoogleLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <GoogleIcon />
            )}
            Sign in with Google
        </Button>
      </CardContent>
    </>
  );
}
