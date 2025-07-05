
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
} from "firebase/auth";
import { LoaderCircle } from "lucide-react";

import { auth, provider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSigningIn(true);
    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description:
          error.code === "auth/invalid-credential"
            ? "Invalid email or password."
            : "An unexpected error occurred. Please try again.",
      });
    } finally {
        setIsSigningIn(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    if (!auth || !provider) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Authentication service not ready. Please try again.",
      });
      setIsSigningIn(false);
      return;
    }

    try {
      await signInWithRedirect(auth, provider);
      // The user will be redirected to Google, and then to our /auth/callback page.
      // We don't need to do anything else here.
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: "Could not initiate Google Sign-In. Please check the console for errors.",
      });
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    {...field}
                    disabled={isSigningIn}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={isSigningIn}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSigningIn}>
            {isSigningIn && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      </Form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        className="w-full bg-[#4285F4] text-white hover:bg-[#4285F4]/90"
        onClick={handleGoogleSignIn}
        disabled={isSigningIn}
      >
        {isSigningIn && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
        Sign in with Google
      </Button>

      <Dialog open={isSigningIn}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="sr-only">Signing In</DialogTitle>
            <DialogDescription className="sr-only">
              Please wait while we are signing you in.
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
