
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoaderCircle, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export function GoogleIntegrationView() {
  const { user, accessToken, setAuthInfo, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

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
            setUnauthorizedDomain(null); // Clear error on success
            toast({
              title: "Authentication Successful",
              description: "Successfully connected to your Google Account.",
            });
          }
        }
      } catch (error: any) {
        console.error("Google Redirect Error:", error);
        if (error.code === 'auth/unauthorized-domain') {
            setUnauthorizedDomain(window.location.hostname);
        } else if (error.code !== 'auth/web-storage-unsupported') {
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
        console.error("Google Sign-In Initiation Error:", error);
        if (error.code === 'auth/unauthorized-domain') {
            setUnauthorizedDomain(window.location.hostname);
        } else {
             toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: error.message || "An unexpected error occurred during sign-in initiation.",
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

  const renderUnauthorizedDomainError = () => (
    <Alert variant="destructive" className="mt-6">
        <Terminal className="h-4 w-4" />
        <AlertTitle className="font-bold">Authentication Failed: Domain Not Authorized</AlertTitle>
        <AlertDescription className="space-y-4 mt-2">
            <p>
                The domain <strong>{unauthorizedDomain}</strong> is not authorized to perform this action. To fix this, you must add it to your Firebase project's list of authorized domains.
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
                After adding the domain, please <a href="#" onClick={() => window.location.reload()} className="underline font-semibold">refresh this page</a> and try again.
            </p>
        </AlertDescription>
    </Alert>
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
    
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="font-semibold text-lg text-center">One More Step: Grant API Access</p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground w-full">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0 mt-1">1</div>
                    <div>
                        <h4 className="font-semibold text-foreground">Sign In to Google</h4>
                        <p>Clicking the button below will take you to Google's secure sign-in page.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0 mt-1">2</div>
                    <div>
                        <h4 className="font-semibold text-foreground">Grant Permissions</h4>
                        <p>Google will ask you to approve access for Ogeemo to view services like your contacts. This is a secure, standard process.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0 mt-1">3</div>
                    <div>
                        <h4 className="font-semibold text-foreground">Return to Ogeemo</h4>
                        <p>After you approve, you'll be brought back here, and the integration will be fully active.</p>
                    </div>
                </div>
            </div>

            <Button onClick={handleSignIn} size="lg" className="w-full">
                <ShieldCheck className="mr-2 h-5 w-5" />
                Proceed to Google & Grant Access
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
            {unauthorizedDomain ? renderUnauthorizedDomainError() : (user ? renderConnectedView() : renderDisconnectedView())}
        </CardContent>
      </Card>
    </div>
  );
}
