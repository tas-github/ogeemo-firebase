
"use client";

import React, { useState } from "react";
import { signOut, linkWithRedirect, GoogleAuthProvider } from "firebase/auth";
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

export function GoogleIntegrationView() {
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { auth } = await initializeFirebase();
      await signOut(auth);
      toast({
        title: "Disconnected",
        description: "Successfully signed out.",
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
            Disconnect Account & Sign Out
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
