
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
import { type Contact, type FolderData } from '@/data/contacts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Plus } from 'lucide-react';
import ContactFormDialog from '../contacts/contact-form-dialog';
import { getFolders } from '@/services/contact-service';
import { useAuth } from '@/context/auth-context';

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
  contacts?: Contact[];
  onContactsChange?: (contacts: Contact[]) => void;
  projectToEdit?: Project | null;
  initialMode?: 'project' | 'task' | 'event';
  initialData?: Partial<any>;
}

export function NewTaskDialog({
  isOpen,
  onOpenChange,
  onProjectCreate,
  onProjectUpdate,
  contacts = [],
  onContactsChange,
  projectToEdit,
  initialData,
}: NewTaskDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clientAction, setClientAction] = useState<'select' | 'add'>('select');
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactFolders, setContactFolders] = useState<FolderData[]>([]);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", contactId: "" },
  });
  
  useEffect(() => {
    if (isOpen) {
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
        
        setClientAction('select'); // Always default to select
    }
  }, [isOpen, projectToEdit, initialData, form]);

  useEffect(() => {
      async function loadFolders() {
          if (user && isContactFormOpen) {
              const folders = await getFolders(user.uid);
              setContactFolders(folders);
          }
      }
      loadFolders();
  }, [user, isContactFormOpen]);

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
  
  const handleContactSave = (savedContact: Contact, isEditing: boolean) => {
    if (onContactsChange) {
        let updatedContacts;
        if (isEditing) {
          updatedContacts = contacts.map(c => c.id === savedContact.id ? savedContact : c);
        } else {
          updatedContacts = [...contacts, savedContact];
        }
        onContactsChange(updatedContacts); // Update parent component's state
    }
    form.setValue('contactId', savedContact.id);
    setClientAction('select');
    setIsContactFormOpen(false);
  };

  return (
    <>
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
              
              <div className="space-y-2">
                <FormLabel>Client</FormLabel>
                <RadioGroup onValueChange={(value: 'select' | 'add') => setClientAction(value)} value={clientAction} className="flex space-x-4">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="select" /></FormControl><FormLabel className="font-normal">Select Existing Client</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="add" /></FormControl><FormLabel className="font-normal">Create New Client</FormLabel></FormItem>
                </RadioGroup>
              </div>

              {clientAction === 'select' ? (
                <FormField
                    control={form.control}
                    name="contactId"
                    render={({ field }) => (
                    <FormItem>
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
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setIsContactFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Contact
                </Button>
              )}

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
      
      {isContactFormOpen && (
        <ContactFormDialog
            isOpen={isContactFormOpen}
            onOpenChange={setIsContactFormOpen}
            contactToEdit={null}
            folders={contactFolders}
            onSave={handleContactSave}
        />
      )}
    </>
  );
}
