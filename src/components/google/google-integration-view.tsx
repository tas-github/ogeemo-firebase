
"use client";

import React, { useState } from "react";
import { signOut, linkWithRedirect } from "firebase/auth";
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
import { LoaderCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export function GoogleIntegrationView() {
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      // The AuthContext will clear the user and token via its onAuthStateChanged listener.
      toast({
        title: "Disconnected",
        description: "Successfully signed out.",
      });
      // The main layout will redirect to /login.
    } catch (error: any) {
       console.error("Google Sign-Out Error:", error);
       toast({
         variant: "destructive",
         title: "Sign-Out Failed",
         description: error.message || "Could not disconnect from Google.",
       });
    }
  };

  const handleLinkGoogleAccount = async () => {
    if (!auth || !provider || !user) {
      toast({ variant: "destructive", title: "Error", description: "Authentication service not ready. Please try again." });
      return;
    }
    setIsLinking(true);
    try {
        await linkWithRedirect(user, provider);
        // Page will redirect, user will come back to /auth/callback
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
    // This case should be handled by the main layout, but as a fallback:
    return (
      <div className="flex h-full items-center justify-center">
        <p>Please log in to manage Google integration.</p>
      </div>
    );
  }

  const renderContent = () => {
    if (accessToken) {
      // The happy path: user is logged in AND we have the token
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
            Disconnect Account & Sign Out
          </Button>
        </div>
      );
    }

    // Edge case: user is logged in but we don't have a token.
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
          {isLinking ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          Connect to Google
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
