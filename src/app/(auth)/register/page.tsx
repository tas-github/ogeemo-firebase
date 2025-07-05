
"use client";

import { useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LoaderCircle } from "lucide-react";

import { initializeFirebase } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleSignUp = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { auth } = await initializeFirebase();
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: values.name,
        });
      }

      toast({
        title: "Account Created",
        description: "Your account has been successfully created. Please log in.",
      });
      router.push("/login");

    } catch (error: any) {
      console.error("Sign-Up Error:", error);
      let description = "An unknown error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use by another account.";
      }
      toast({
        variant: "destructive",
        title: "Sign-Up Failed",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline font-semibold">Create an Account</CardTitle>
        <CardDescription>Enter your details below to create your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} disabled={isLoading} />
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
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </>
  );
}
