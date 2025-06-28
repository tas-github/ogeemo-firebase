
"use client";

import React, { useEffect, useState } from "react";
import {
  signInWithRedirect,
  getRedirectResult,
  signOut,
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
import { LoaderCircle, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export function GoogleIntegrationView() {
  const { user, accessToken, setAuthInfo, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    const processRedirectResult = async () => {
      if (!auth) {
        setIsProcessingRedirect(false);
        return;
      }
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential?.accessToken;
          if (token) {
            setAuthInfo(result.user, token);
            toast({
              title: "Authentication Successful",
              description: "Successfully connected to your Google Account.",
            });
          }
        }
      } catch (error: any) {
        console.error("Google Redirect Error:", error);
        if (error.code !== 'auth/web-storage-unsupported') {
            toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: error.message || "An unknown error occurred during sign-in.",
            });
        }
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    processRedirectResult();
  }, [setAuthInfo, toast]);

  const handleSignIn = async () => {
    if (!auth || !provider) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Firebase is not configured correctly. Please check your setup.",
      });
      return;
    }
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Sign-in initiation failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        toast({
          variant: "destructive",
          title: "Authentication Domain Error",
          description: `This app's domain is not authorized. Please add the exact domain from your browser's address bar to the Firebase Console's list of authorized domains.`,
          duration: 10000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "An unknown error occurred during sign-in.",
        });
      }
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

  const renderConnectedView = () => {
    if (!user) return null;

    if (accessToken) {
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="font-semibold text-lg">API Ready</p>
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
          <Button onClick={handleSignOut} variant="destructive">
            Disconnect Account
          </Button>
        </div>
      );
    }
    
    // This is the state where user is logged in, but we need API access token.
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="font-semibold text-lg">API Access Required</p>
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
            <p className="text-center text-sm text-muted-foreground">
                Your Ogeemo account is connected to Google, but API access is needed for features like importing contacts. Click the button below to grant permissions.
            </p>
            <Button onClick={handleSignIn}>
                Refresh API Connection
            </Button>
        </div>
    );
  };
  
  const renderDisconnectedView = () => (
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
  );

  if (isAuthLoading || isProcessingRedirect) {
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
            {user ? renderConnectedView() : renderDisconnectedView()}
        </CardContent>
      </Card>
    </div>
  );
}
