
"use client";

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { addActionChip, managerOptions } from '@/services/project-service';
import type { ActionChipData } from '@/types/calendar';
import { Mail, Briefcase, ListTodo, Calendar, Clock, Contact, Beaker, Calculator, Folder, Wand2, MessageSquare, HardHat, Contact2, Share2, Users2, PackageSearch, Megaphone, Landmark, DatabaseBackup, BarChart3, HeartPulse, Bell, Bug, Database, FilePlus2, LogOut, Settings, LucideIcon } from 'lucide-react';

const iconMap: { [key: string]: LucideIcon } = { Mail, Briefcase, ListTodo, Calendar, Clock, Contact, Beaker, Calculator, Folder, Wand2, MessageSquare, HardHat, Contact2, Share2, Users2, PackageSearch, Megaphone, Landmark, DatabaseBackup, BarChart3, HeartPulse, Bell, Bug, Database, FilePlus2, LogOut, Settings };

const addActionSchema = z.object({
  label: z.string().min(2, { message: "Label must be at least 2 characters." }),
  actionType: z.enum(['openManager']),
  target: z.string({ required_error: "Please select a target." }),
});

type AddActionFormData = z.infer<typeof addActionSchema>;

interface AddActionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onActionAdded: (action: ActionChipData) => void;
}

export default function AddActionDialog({ isOpen, onOpenChange, onActionAdded }: AddActionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useForm<AddActionFormData>({
    resolver: zodResolver(addActionSchema),
    defaultValues: {
      label: "",
      actionType: "openManager",
      target: undefined,
    },
  });

  async function onSubmit(values: AddActionFormData) {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }
    
    const selectedManager = managerOptions.find(m => m.href === values.target);
    if (!selectedManager) {
        toast({ variant: "destructive", title: "Invalid target selected." });
        return;
    }

    try {
      const newActionData: Omit<ActionChipData, 'id'> = {
        label: values.label,
        icon: selectedManager.icon,
        href: selectedManager.href,
        userId: user.uid,
      };

      const newAction = await addActionChip(newActionData);
      onActionAdded(newAction);
      
      toast({ title: "Action Added", description: `"${values.label}" has been added to your dashboard.` });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to add action", description: error.message });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Action</DialogTitle>
          <DialogDescription>
            Create a custom shortcut for your Action Dashboard.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., View Projects" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="openManager">Open a Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manager to open..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {managerOptions.map((option) => (
                        <SelectItem key={option.href} value={option.href}>
                            <div className="flex items-center gap-2">
                                <option.icon className="h-4 w-4" />
                                <span>{option.label}</span>
                            </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Add Action</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
