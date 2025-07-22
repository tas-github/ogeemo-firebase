
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { LoaderCircle, Rocket } from 'lucide-react';

import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/lib/firebase';
import { TermsDialog } from '@/components/auth/terms-dialog';

const registerSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleInitialSubmit = (values: RegisterFormData) => {
    setFormData(values);
    setIsTermsDialogOpen(true);
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    
    setIsLoading(true);
    try {
        const { auth } = await initializeFirebase();
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        if (userCredential.user) {
            await updateProfile(userCredential.user, {
                displayName: formData.name,
            });
        }
        
        toast({
            title: "Welcome to the Beta Program!",
            description: "Your account has been created successfully.",
        });
        
        // The AuthProvider will handle the redirect to /dashboard
        // so we don't need a router.push here.

    } catch (error: any) {
        let description = "An unknown error occurred. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            description = "This email is already associated with an account.";
        }
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: description,
        });
    } finally {
        setIsLoading(false);
        setIsTermsDialogOpen(false);
        setFormData(null);
    }
  }

  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline font-semibold">Join the Ogeemo Beta Program</CardTitle>
        <CardDescription>
            Welcome! By signing up, you'll be part of a cutting-edge technology project. Your input will form an invaluable part of our success. We encourage you to use your own business to test Ogeemo, as that will provide real-world data to help us improve.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
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
                                <Input placeholder="name@example.com" {...field} />
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
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <p className="text-xs text-center text-muted-foreground pt-2">
                    By clicking "Review Terms", you agree to our Beta Program Terms of Service.
                </p>
                <Button type="submit" className="w-full">
                    Review Terms
                </Button>
            </form>
        </Form>
      </CardContent>
       <CardFooter className="justify-center text-sm">
        <p>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
            </Link>
        </p>
      </CardFooter>

      <TermsDialog
        isOpen={isTermsDialogOpen}
        onOpenChange={setIsTermsDialogOpen}
        onConfirm={handleFinalSubmit}
        isSubmitting={isLoading}
      />
    </>
  );
}
