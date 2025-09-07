
"use client";

import React, { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type Project, type Event as TaskEvent } from '@/types/calendar-types';
import { type Contact } from '@/data/contacts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const projectSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  description: z.string().optional(),
  contactId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectCreate: (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>, tasks: Omit<TaskEvent, 'id' | 'userId' | 'projectId'>[]) => void;
  onProjectUpdate?: (project: Project) => void;
  contacts: Contact[];
  projectToEdit?: Project | null;
  initialMode?: 'project' | 'task' | 'event';
  initialData?: Partial<any>;
}

export function NewTaskDialog({
  isOpen,
  onOpenChange,
  onProjectCreate,
  onProjectUpdate,
  contacts,
  projectToEdit,
  initialData,
}: NewTaskDialogProps) {
  const { toast } = useToast();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", contactId: "" },
  });
  
  useEffect(() => {
    if (isOpen) {
        // Clear session storage item once it's used
        sessionStorage.removeItem('ogeemo-idea-to-project');
        if (projectToEdit) {
            form.reset({
                name: projectToEdit.name,
                description: projectToEdit.description || "",
                contactId: projectToEdit.contactId || "",
            });
        } else if (initialData) {
            form.reset({
                name: initialData.title || "",
                description: initialData.description || "",
                contactId: initialData.contactId || "",
            });
        } else {
            form.reset({ name: "", description: "", contactId: "" });
        }
    }
  }, [isOpen, projectToEdit, initialData, form]);

  async function onSubmit(values: ProjectFormData) {
    if (projectToEdit && onProjectUpdate) {
        onProjectUpdate({
            ...projectToEdit,
            ...values,
            contactId: values.contactId || null,
        });
    } else {
        onProjectCreate({
            name: values.name,
            description: values.description,
            contactId: values.contactId || null,
        }, []);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{projectToEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {projectToEdit ? 'Update the details for your project.' : 'Fill in the details to create a new project.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Website Redesign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign a client (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the project goals and objectives..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{projectToEdit ? 'Save Changes' : 'Create Project'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
