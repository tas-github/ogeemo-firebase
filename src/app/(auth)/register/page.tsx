
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Rocket } from 'lucide-react';

import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { TermsDialog } from '@/components/auth/terms-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const registerSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    betaReason: z.string().min(10, { message: "Please tell us a bit more about your interest." }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const { firebaseServices } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", businessName: "", businessType: "", betaReason: "" },
  });

  const handleInitialSubmit = (values: RegisterFormData) => {
    setFormData(values);
    setIsTermsDialogOpen(true);
  };

  const handleFinalSubmit = async () => {
    if (!formData || !firebaseServices) return;
    
    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(firebaseServices.auth, formData.email, formData.password);
        
        if (userCredential.user) {
            await updateProfile(userCredential.user, {
                displayName: formData.name,
            });
        }
        
        // In a real app, you would save formData.businessName, businessType, betaReason to a 'betaApplications' collection in Firestore.
        console.log("Beta Application Data:", {
            name: formData.name,
            email: formData.email,
            businessName: formData.businessName,
            businessType: formData.businessType,
            betaReason: formData.betaReason,
        });

        toast({
            title: "Welcome to the Beta Program!",
            description: "Your account has been created successfully.",
        });
        
        // The AuthProvider will handle the redirect to /dashboard

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
            Welcome! By signing up, you'll be part of a cutting-edge technology project. Your input will form an invaluable part of our success.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Your Name</FormLabel> <FormControl><Input placeholder="John Doe" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input placeholder="name@example.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Password</FormLabel> <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem> <FormLabel>Business Name (Optional)</FormLabel> <FormControl><Input placeholder="Acme Inc." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="businessType" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select your business type..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="freelancer">Freelancer / Solopreneur</SelectItem>
                                <SelectItem value="small-business">Small Business (1-10 employees)</SelectItem>
                                <SelectItem value="agency">Agency / Consultancy</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="betaReason" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Why do you want to be a beta tester?</FormLabel>
                        <FormControl><Textarea placeholder="I'm interested in testing Ogeemo because..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                 )} />
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
