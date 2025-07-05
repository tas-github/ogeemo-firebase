
"use client";

import React, { useState } from "react";
import { signOut, linkWithRedirect, GoogleAuthProvider, getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeFirebase } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoaderCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

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

export function GoogleIntegrationView() {
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { auth } = await initializeFirebase();
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "Successfully signed out.",
      });
    } catch (error: any) {
       console.error("Google Sign-Out Error:", error);
       toast({
         variant: "destructive",
         title: "Sign-Out Failed",
         description: error.message || "Could not sign out.",
       });
    }
  };

  const handleLinkGoogleAccount = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to connect your account." });
      return;
    }
    setIsLinking(true);
    try {
        const { auth } = await initializeFirebase();
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        
        // Store the current path to redirect back here after auth
        sessionStorage.setItem('google_auth_redirect', '/google');

        await linkWithRedirect(user, provider);
    } catch (error: any) {
        console.error("Google Account Linking Error:", error);
        let description = "An unexpected error occurred.";
        if (error.code === 'auth/credential-already-in-use') {
            description = "This Google account is already linked to another user.";
        }
        toast({
            variant: "destructive",
            title: "Could Not Link Account",
            description,
        });
        setIsLinking(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Please log in to manage Google integration.</p>
      </div>
    );
  }

  const renderContent = () => {
    if (accessToken) {
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="font-semibold text-lg">Connected to Google</p>
          </div>
          <p className="text-center text-muted-foreground">Ogeemo has been granted permission to access your Google account data.</p>
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
            Sign Out
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="font-semibold text-lg text-center">Connection Required</p>
        </div>
        <p className="text-center text-muted-foreground">
          To enable full integration with Google services like Contacts and Calendar, please connect your Google account.
        </p>
        <Button onClick={handleLinkGoogleAccount} size="lg" className="w-full bg-[#4285F4] text-white hover:bg-[#4285F4]/90" disabled={isLinking}>
          {isLinking ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
          {isLinking ? 'Redirecting...' : 'Connect to Google'}
        </Button>
      </div>
    );
  };
  
  return (
    <div className="p-4 sm:p-6 flex flex-col items-center h-full pt-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline text-primary">
            Google Integration
          </CardTitle>
          <CardDescription>
            Manage your connection to Google Workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
