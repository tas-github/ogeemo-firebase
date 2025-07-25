
'use client';

import React, { useState } from "react";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { LoaderCircle, CheckCircle2, AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { initializeFirebase } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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

export function GoogleIntegrationView() {
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
        const { auth } = await initializeFirebase();
        const provider = new GoogleAuthProvider();
        
        // This scope asks for permission to read the user's contacts.
        provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        
        // This tells our callback page where to redirect after a successful connection.
        sessionStorage.setItem('google_auth_redirect', '/google');

        await signInWithRedirect(auth, provider);
    } catch(error: any) {
        console.error("Google connection error:", error);
        let description = error.message || "An unknown error occurred.";
        if (error.code === 'auth/unauthorized-domain') {
            description = `This domain (${window.location.hostname}) is not authorized for OAuth operations. Please add it to the authorized domains in your Firebase console's authentication settings.`;
        }
        toast({
            variant: "destructive",
            title: "Connection Failed",
            description: description,
        });
        setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
      sessionStorage.removeItem('google_access_token');
      window.location.reload(); 
  };
  
  const isLoading = isAuthLoading || isConnecting;

  return (
    <div className="p-4 sm:p-6 flex items-center justify-center h-full">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Google Integration</CardTitle>
          <CardDescription>
            Connect your Google account to integrate services like Contacts. This will request read-only access to your Google Contacts list.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="flex items-center justify-center p-8">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                 </div>
            ) : accessToken ? (
                <div className="flex items-center p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-6 w-6 mr-4 text-green-600 dark:text-green-400" />
                    <div>
                        <p className="font-semibold text-green-800 dark:text-green-300">Account Connected</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </div>
            ) : (
                 <div className="flex items-center p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-6 w-6 mr-4 text-amber-600 dark:text-amber-400" />
                    <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-300">Not Connected</p>
                        <p className="text-sm text-muted-foreground">Connect your account to get started.</p>
                    </div>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
            {accessToken ? (
                <Button variant="destructive" onClick={handleDisconnect}>
                    <LogOut className="mr-2 h-4 w-4" /> Disconnect Google Account
                </Button>
            ) : (
                <Button onClick={handleConnect} disabled={isLoading} className="w-full">
                    {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Connect Google Account
                </Button>
            )}
            <p className="text-xs text-muted-foreground">
                If you encounter an error, ensure your app's domain is authorized in Firebase and the necessary APIs/scopes are enabled in your Google Cloud Console's OAuth consent screen.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
