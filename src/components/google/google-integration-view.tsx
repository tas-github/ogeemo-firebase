
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export function GoogleIntegrationView() {
  const { isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const handleLoginClick = () => {
    toast({
      title: "Login Initiated",
      description: "Next, we will add the logic to handle the Google Sign-In.",
    });
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex items-center justify-center h-full">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Google Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <p>testing</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleLoginClick} className="w-full">
            Click here to log into your google account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
