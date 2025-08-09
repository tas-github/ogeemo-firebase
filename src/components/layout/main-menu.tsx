
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from "next/navigation";
import { allMenuItems, type MenuItem } from '@/lib/menu-items';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Separator } from '../ui/separator';
import { UserNav } from '../user-nav';
import { DraggableMenuItem } from './DraggableMenuItem';
import { Button } from '../ui/button';
import { Save } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, getUserProfile } from '@/services/user-profile-service';

export function MainMenu() {
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(allMenuItems);
  const { preferences, isLoading } = useUserPreferences();
  const { user } = useAuth();
  const { toast } = useToast();

  const sortMenuItems = useCallback((order: string[]) => {
    const orderedItems = order
      .map(href => allMenuItems.find(item => item.href === href))
      .filter(Boolean) as MenuItem[];
    const remainingItems = allMenuItems.filter(item => !order.includes(item.href));
    return [...orderedItems, ...remainingItems];
  }, []);

  useEffect(() => {
    if (!isLoading && preferences?.menuOrder && preferences.menuOrder.length > 0) {
      setMenuItems(sortMenuItems(preferences.menuOrder));
    } else if (!isLoading) {
      // Fallback to default alphabetical sort if no order is saved
      setMenuItems([...allMenuItems].sort((a, b) => a.label.localeCompare(b.label)));
    }
  }, [preferences, isLoading, sortMenuItems]);

  const moveMenuItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setMenuItems((prevItems: MenuItem[]) => {
      const newItems = [...prevItems];
      const [draggedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, draggedItem);
      return newItems;
    });
  }, []);
  
  const handleSaveChanges = async () => {
    if (!user) return;
    try {
        const orderToSave = menuItems.map(item => item.href);
        const profile = await getUserProfile(user.uid);
        await updateUserProfile(user.uid, user.email || '', {
            ...profile,
            preferences: { ...profile?.preferences, menuOrder: orderToSave }
        });

        toast({
            title: "Menu Order Saved",
            description: "Your new menu order has been saved."
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  };

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex-1 space-y-1">
        {menuItems.map((item, index) => (
          <DraggableMenuItem
            key={item.href}
            item={item}
            index={index}
            isActive={pathname === item.href || (item.href !== '/action-manager' && pathname.startsWith(item.href))}
            moveMenuItem={moveMenuItem}
          />
        ))}
      </div>
      <div className="p-2 mt-2">
        <Button onClick={handleSaveChanges} className="w-full">
            <Save className="mr-2 h-4 w-4" /> Save Order
        </Button>
      </div>
       <div className="mt-auto md:hidden">
            <Separator className="my-2" />
            <UserNav />
        </div>
    </div>
  );
}
