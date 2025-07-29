
"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Settings, User as UserIcon, MoreHorizontal, Info, Newspaper, FileText, ShieldCheck, MessageSquare } from "lucide-react";
import { signOut } from "firebase/auth";

import { initializeFirebase } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useLoading } from "@/context/loading-context";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navLinks } from "@/lib/constants";

export function UserNav() {
  const { state: sidebarState } = useSidebar();
  const { user } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { toast } = useToast();

  const handleLogout = async () => {
    showLoading("Signing out...");
    try {
      const { auth } = await initializeFirebase();
      await signOut(auth);
      // The redirect is handled by the AuthProvider listener, which will
      // trigger the layout's useEffect to hide the loading modal.
    } catch (error) {
       console.error("Logout error:", error);
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An unexpected error occurred. Please try again.",
      });
       hideLoading();
    }
  };

  if (!user) {
    return null;
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const dropdownContent = (
    <DropdownMenuContent className="w-56" align="end" forceMount>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {user.email}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {navLinks.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
                <Link href={link.href}>
                    <link.icon className="mr-2 h-4 w-4" />
                    <span>{link.label}</span>
                </Link>
            </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (sidebarState === "collapsed") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.photoURL || undefined}
                alt={user.displayName || 'User avatar'}
              />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <div className="flex w-full items-center gap-2" role="button">
                <Avatar className="h-8 w-8">
                   <AvatarImage
                      src={user.photoURL || undefined}
                      alt={user.displayName || 'User avatar'}
                    />
                   <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                  <p className="truncate text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <MoreHorizontal className="h-4 w-4 shrink-0" />
            </div>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
  );
}
