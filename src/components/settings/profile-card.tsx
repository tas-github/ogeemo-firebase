
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile } from "firebase/auth";

import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react";
import { initializeFirebase } from "@/lib/firebase";


const profileSchema = z.object({
    displayName: z.string().min(2, { message: "Name must be at least 2 characters." }).optional(),
});

export function ProfileCard() {
  const { user, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
      });
    }
  }, [user, form]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to update your profile." });
        return;
    }
    
    try {
        const { auth } = await initializeFirebase();
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: data.displayName,
            });

            // Note: To see the update reflected immediately without a page refresh,
            // the user object in the AuthContext would need to be re-fetched or updated.
            // For simplicity, we'll rely on a page refresh or re-login for the nav bar to update.
            
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
            setIsEditing(false);
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    );
  }

  if (!user) {
    return <p className="text-muted-foreground">User not found. Please log in again.</p>;
  }

  if (isEditing) {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User avatar'} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1">
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div>
                            <Label>Email</Label>
                            <Input value={user.email || ''} disabled className="mt-2" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); form.reset({ displayName: user.displayName || "" }); }}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    )
  }

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User avatar'} />
          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{user.displayName || "Anonymous User"}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
    </div>
  );
}
