
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
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { initializeFirebase } from "@/lib/firebase";
import { getUserProfile, updateUserProfile, type UserProfile } from "@/services/user-profile-service";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const profileSchema = z.object({
    displayName: z.string().min(2, { message: "Name must be at least 2 characters." }).optional(),
    businessPhone: z.string().optional(),
    cellPhone: z.string().optional(),
    bestPhone: z.enum(['business', 'cell']).optional(),
    businessAddress: z.string().optional(),
    homeAddress: z.string().optional(),
    alternateContact: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileCard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        setIsLoading(true);
        try {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
          form.reset({
            displayName: user.displayName || "",
            businessPhone: userProfile?.businessPhone || "",
            cellPhone: userProfile?.cellPhone || "",
            bestPhone: userProfile?.bestPhone,
            businessAddress: userProfile?.businessAddress || "",
            homeAddress: userProfile?.homeAddress || "",
            alternateContact: userProfile?.alternateContact || "",
          });
        } catch (error) {
          console.error("Failed to load user profile:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    if (!isAuthLoading) {
        loadProfile();
    }
  }, [user, isAuthLoading, form, isEditing]);


  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to update your profile." });
        return;
    }
    
    try {
        const { auth } = await initializeFirebase();
        // Update Firebase Auth profile (for display name)
        if (auth.currentUser && data.displayName && data.displayName !== user.displayName) {
            await updateProfile(auth.currentUser, {
                displayName: data.displayName,
            });
        }
        
        // Update Firestore profile (for extended data)
        const profileDataToUpdate = {
            businessPhone: data.businessPhone,
            cellPhone: data.cellPhone,
            bestPhone: data.bestPhone,
            businessAddress: data.businessAddress,
            homeAddress: data.homeAddress,
            alternateContact: data.alternateContact,
        };
        await updateUserProfile(user.uid, user.email!, profileDataToUpdate);
        
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
        setIsEditing(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    // form.reset will be called by the useEffect when isEditing changes
  }

  if (isLoading || isAuthLoading) {
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
                <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User avatar'} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                     <div className="space-y-1 flex-1">
                        <FormField control={form.control} name="displayName" render={({ field }) => ( <FormItem> <FormLabel>Display Name</FormLabel> <FormControl><Input placeholder="Your Name" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                         <div className="text-sm text-muted-foreground pt-1">{user.email}</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="businessPhone" render={({ field }) => (<FormItem><FormLabel>Business Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="cellPhone" render={({ field }) => (<FormItem><FormLabel>Cell Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                
                <FormField control={form.control} name="bestPhone" render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel>Best number to call</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="business" /></FormControl><FormLabel className="font-normal">Business</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cell" /></FormControl><FormLabel className="font-normal">Cell</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl>
                    </FormItem>
                )} />

                <div className="space-y-4">
                    <FormField control={form.control} name="businessAddress" render={({ field }) => (<FormItem><FormLabel>Business Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="homeAddress" render={({ field }) => (<FormItem><FormLabel>Home Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="alternateContact" render={({ field }) => (<FormItem><FormLabel>Alternate Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
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
    <div className="space-y-6">
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
        <div className="border-t pt-6 space-y-4 text-sm">
             <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground col-span-1">Business Phone</div><div className="col-span-2">{profile?.businessPhone || 'Not set'}</div></div>
             <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground col-span-1">Cell Phone</div><div className="col-span-2">{profile?.cellPhone || 'Not set'}</div></div>
             <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground col-span-1">Best Number</div><div className="col-span-2 capitalize">{profile?.bestPhone || 'Not set'}</div></div>
             <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground col-span-1">Business Address</div><div className="col-span-2">{profile?.businessAddress || 'Not set'}</div></div>
             <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground col-span-1">Home Address</div><div className="col-span-2">{profile?.homeAddress || 'Not set'}</div></div>
             <div className="grid grid-cols-3 gap-2"><div className="text-muted-foreground col-span-1">Alternate Contact</div><div className="col-span-2">{profile?.alternateContact || 'Not set'}</div></div>
        </div>
    </div>
  );
}
