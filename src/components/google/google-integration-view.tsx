
"use client";

import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoaderCircle, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export function GoogleIntegrationView() {
  const { user, accessToken, setAuthInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Set the Firebase user on load, but reset the API token.
      // A new token is only acquired through an explicit sign-in.
      setAuthInfo(currentUser, null);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setAuthInfo]);

  const handleSignIn = async () => {
    if (!auth || !provider) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Firebase is not configured correctly. Please check your setup.",
        });
        return;
    }
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      const token = credential?.accessToken;

      if (token) {
        console.log("Google OAuth Access Token:", token);
        setAuthInfo(result.user, token);
        toast({
            title: "Authentication Successful",
            description: "Successfully connected to your Google Account.",
        });
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "An unknown error occurred during sign-in.",
      });
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setAuthInfo(null, null);
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from your Google Account.",
      });
    } catch (error: any) {
      console.error("Google Sign-Out Error:", error);
       toast({
        variant: "destructive",
        title: "Sign-Out Failed",
        description: error.message || "Could not disconnect from Google.",
      });
    }
  };
  
  const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 mr-2">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.229-11.303-7.582l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.447-2.274 4.481-4.244 5.892l6.19 5.238C42.012 35.245 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );


  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center h-full pt-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline text-primary">
            Google Integration
          </CardTitle>
          <CardDescription>
            Connect your Google account to sync your data with Ogeemo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <p className="font-semibold text-lg">{accessToken ? 'API Ready' : 'Account Connected'}</p>
              </div>
              <div className="flex items-center gap-4 rounded-lg border p-4 w-full">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <p className="font-semibold truncate">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              {!accessToken && (
                 <p className="text-center text-sm text-muted-foreground">
                    Your account is connected, but to use API features like downloading to Drive, you need to re-authenticate to get a fresh API token.
                </p>
              )}
              <Button onClick={accessToken ? handleSignOut : handleSignIn} variant={accessToken ? "destructive" : "default"}>
                {accessToken ? 'Disconnect Account' : 'Connect for API Access'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <XCircle className="h-8 w-8 text-destructive" />
                <p className="font-semibold text-lg">Not Connected</p>
              </div>
              <p className="text-center text-muted-foreground">
                To continue, please sign in with your Google account. This will allow Ogeemo to access your Google services securely.
              </p>
              <Button onClick={handleSignIn} size="lg" className="w-full">
                <GoogleIcon />
                Connect with Google
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
