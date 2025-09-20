
"use client";

import React, { useEffect } from 'react';
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
import { managerOptions } from '@/lib/manager-options';
import type { ActionChipData } from '@/types/calendar';
import { Wand2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const addActionSchema = z.object({
  label: z.string().min(1, { message: "Label is required." }),
  linkType: z.enum(['page', 'url']).default('page'),
  targetPage: z.string().optional(),
  targetUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
}).refine(data => {
    if (data.linkType === 'page') return !!data.targetPage;
    return true;
}, {
    message: "Please select a page from the dropdown.",
    path: ['targetPage'],
}).refine(data => {
    if (data.linkType === 'url') return !!data.targetUrl;
    return true;
}, {
    message: "Please enter a URL.",
    path: ['targetUrl'],
});


type AddActionFormData = z.infer<typeof addActionSchema>;

interface AddActionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onActionAdded: (action: ActionChipData) => void;
  onActionEdited: (action: ActionChipData) => void;
  chipToEdit: ActionChipData | null;
}

export default function AddActionDialog({ isOpen, onOpenChange, onActionAdded, onActionEdited, chipToEdit }: AddActionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useForm<AddActionFormData>({
    resolver: zodResolver(addActionSchema),
    defaultValues: {
      label: "",
      linkType: 'page',
      targetPage: undefined,
      targetUrl: "",
    },
  });
  
  useEffect(() => {
    if (chipToEdit) {
        let linkType: 'page' | 'url' = 'page';
        let targetPage: string | undefined = undefined;
        let targetUrl: string | undefined = undefined;

        if (typeof chipToEdit.href === 'string') {
            if (chipToEdit.href.startsWith('/')) {
                linkType = 'page';
                targetPage = chipToEdit.href;
            } else if (chipToEdit.href.startsWith('http')) {
                linkType = 'url';
                targetUrl = chipToEdit.href;
            } else {
                linkType = 'page'; // Default if href is empty or invalid
            }
        }

        form.reset({
            label: chipToEdit.label,
            linkType,
            targetPage,
            targetUrl: targetUrl || "",
        });
    } else {
        form.reset({
          label: "",
          linkType: 'page',
          targetPage: undefined,
          targetUrl: "",
        });
    }
  }, [chipToEdit, form]);

  const linkType = form.watch('linkType');

  async function onSubmit(values: AddActionFormData) {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }
    
    let href: ActionChipData['href'] = '';
    let icon = Wand2;

    if (values.linkType === 'page' && values.targetPage) {
        href = values.targetPage;
        const selectedManager = managerOptions.find(m => m.href === values.targetPage);
        if (selectedManager) {
            icon = selectedManager.icon;
        }
    } else if (values.linkType === 'url' && values.targetUrl) {
        href = values.targetUrl;
    }

    try {
      if (chipToEdit) {
        const updatedActionData: ActionChipData = {
            ...chipToEdit,
            label: values.label,
            href,
            icon,
        };
        await updateActionChip(user.uid, updatedActionData);
        onActionEdited(updatedActionData);
        toast({ title: "Action Updated" });
      } else {
         const newActionData: Omit<ActionChipData, 'id'> = {
            label: values.label,
            icon,
            href,
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
            {chipToEdit ? 'Modify the details for this action.' : 'Create a custom shortcut for your Action Dashboard.'}
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
                    <Input placeholder="e.g., Accounts Receivable" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="linkType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Link Type</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                            >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="page" /></FormControl>
                                    <FormLabel className="font-normal">Select a Page</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="url" /></FormControl>
                                    <FormLabel className="font-normal">Enter a URL</FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                    </FormItem>
                )}
            />

            {linkType === 'page' && (
                <FormField
                    control={form.control}
                    name="targetPage"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Target Page</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a page to open..." />
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
            )}

            {linkType === 'url' && (
                 <FormField
                    control={form.control}
                    name="targetUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Target Page or URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
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
