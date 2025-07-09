
"use client";

import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function ProfileCard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };
  
  const handleEditClick = () => {
    toast({
        title: "Feature Coming Soon",
        description: "Editing user profiles will be available in a future update.",
    });
  }

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
      <Button variant="outline" onClick={handleEditClick}>Edit</Button>
    </div>
  );
}
