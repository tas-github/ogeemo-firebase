
"use client";

import React, { useEffect, useMemo } from 'react';
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
import { addActionChip, updateActionChip } from '@/services/project-service';
import { allMenuItems } from '@/lib/menu-items';
import type { ActionChipData } from '@/types/calendar';
import { Wand2 } from 'lucide-react';

const addActionSchema = z.object({
  label: z.string().min(1, { message: "Label is required." }),
  targetPage: z.string({ required_error: "Please select a page from the dropdown." }).min(1, { message: "Please select a page." }),
});

type AddActionFormData = z.infer<typeof addActionSchema>;

interface AddActionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onActionAdded: (action: ActionChipData) => void;
  onActionEdited: (action: ActionChipData) => void;
  chipToEdit: ActionChipData | null;
  existingChips: ActionChipData[];
}

export default function AddActionDialog({ isOpen, onOpenChange, onActionAdded, onActionEdited, chipToEdit, existingChips }: AddActionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useForm<AddActionFormData>({
    resolver: zodResolver(addActionSchema),
    defaultValues: {
      label: "",
      targetPage: undefined,
    },
  });
  
  const availableMenuItems = useMemo(() => {
    const existingHrefs = new Set(existingChips.map(c => c.href));
    // If we are editing a chip, allow its own href to be in the list
    if (chipToEdit) {
      existingHrefs.delete(chipToEdit.href as string);
    }
    return allMenuItems.filter(item => !existingHrefs.has(item.href));
  }, [existingChips, chipToEdit]);
  
  useEffect(() => {
    if (chipToEdit) {
        let targetPage: string | undefined = undefined;

        if (typeof chipToEdit.href === 'string' && chipToEdit.href.startsWith('/')) {
            targetPage = chipToEdit.href;
        }

        form.reset({
            label: chipToEdit.label,
            targetPage,
        });
    } else {
        form.reset({
          label: "",
          targetPage: undefined,
        });
    }
  }, [chipToEdit, form]);

  async function onSubmit(values: AddActionFormData) {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }
    
    const selectedManager = allMenuItems.find(m => m.href === values.targetPage);
    if (!selectedManager) {
      toast({ variant: "destructive", title: "Invalid page selected." });
      return;
    }

    try {
      if (chipToEdit) {
        const updatedActionData: ActionChipData = {
            ...chipToEdit,
            label: values.label,
            href: selectedManager.href,
            icon: selectedManager.icon,
        };
        await updateActionChip(user.uid, updatedActionData);
        onActionEdited(updatedActionData);
        toast({ title: "Action Updated" });
      } else {
         const newActionData: Omit<ActionChipData, 'id'> = {
            label: values.label,
            icon: selectedManager.icon,
            href: selectedManager.href,
            userId: user.uid,
         };
         const newAction = await addActionChip(newActionData);
         onActionAdded(newAction);
         toast({ title: "Action Added" });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to save action", description: error.message });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chipToEdit ? 'Edit Action' : 'Add New Action'}</DialogTitle>
          <DialogDescription>
            {chipToEdit ? 'Modify the details for this action.' : 'Create a shortcut for your Action Dashboard from an available page.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a custom label for the chip" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="targetPage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Page</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      const selected = availableMenuItems.find(item => item.href === value);
                      if (selected && !form.getValues('label')) {
                          form.setValue('label', selected.label);
                      }
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a page to add..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableMenuItems.map((option) => (
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
                <Button type="submit">{chipToEdit ? 'Save Changes' : 'Add Action'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
