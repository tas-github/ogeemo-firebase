
"use client";

import { useEffect, useState, useRef } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Mic, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from '@/components/ui/textarea';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { useToast } from '@/hooks/use-toast';
import { type Contact, type FolderData } from '@/data/contacts';
import { ScrollArea } from '../ui/scroll-area';

const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  businessPhone: z.string().optional(),
  cellPhone: z.string().optional(),
  homePhone: z.string().optional(),
  faxNumber: z.string().optional(),
  primaryPhoneType: z.enum(['businessPhone', 'cellPhone', 'homePhone']).optional(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    contactToEdit: Contact | null;
    selectedFolderId: string;
    folders: FolderData[];
    onSave: (contact: Contact | Omit<Contact, 'id'>, isEditing: boolean) => void;
}

export default function ContactFormDialog({
    isOpen,
    onOpenChange,
    contactToEdit,
    selectedFolderId,
    folders,
    onSave,
}: ContactFormDialogProps) {
    const { toast } = useToast();
    const [notesBeforeSpeech, setNotesBeforeSpeech] = useState('');
    const notesRef = useRef<HTMLTextAreaElement>(null);

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: { name: "", email: "", businessPhone: "", cellPhone: "", homePhone: "", faxNumber: "", primaryPhoneType: undefined, notes: "" },
    });
    
    useEffect(() => {
        if (isOpen) {
            form.reset(contactToEdit || { name: "", email: "", businessPhone: "", cellPhone: "", homePhone: "", faxNumber: "", primaryPhoneType: undefined, notes: "" });
        }
    }, [isOpen, contactToEdit, form]);

    const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
        onTranscript: (transcript) => {
            const newText = notesBeforeSpeech ? `${notesBeforeSpeech} ${transcript}`.trim() : transcript;
            form.setValue('notes', newText, { shouldValidate: true });
        },
    });

    const handleDictateNotes = () => {
        if (isListening) {
            stopListening();
        } else {
            setNotesBeforeSpeech(form.getValues('notes') || '');
            form.setFocus('notes');
            startListening();
        }
    };
    
    async function onSubmit(values: ContactFormData) {
        try {
            if (contactToEdit) {
                const updatedContact = { ...contactToEdit, ...values };
                onSave(updatedContact, true);
            } else {
                if (selectedFolderId === 'all') {
                    toast({ variant: "destructive", title: "Cannot Add Contact", description: "Please select a specific folder before adding a new contact." });
                    return;
                }
                const newContactData: Omit<Contact, 'id'> = {
                    ...values,
                    folderId: selectedFolderId
                };
                onSave(newContactData, false);
            }
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to save contact:", error);
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: error.message || "Could not save the contact to the database.",
            });
        }
    }
    
    const selectedFolder = folders.find(f => f.id === (contactToEdit?.folderId || selectedFolderId));

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl flex flex-col p-0" side="right">
                <SheetHeader className="p-6 pb-4">
                    <SheetTitle className="text-2xl font-bold font-headline text-primary">
                        {contactToEdit ? "Edit Contact" : "New Contact"}
                    </SheetTitle>
                    <SheetDescription>
                        {contactToEdit ? `Editing details for ${contactToEdit.name}.` : `Create a new contact in the "${selectedFolder?.name || 'Unassigned'}" folder.`}
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1">
                            <div className="px-6 pb-4 space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Name</FormLabel> <FormControl><Input placeholder="John Doe" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="businessPhone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business #</FormLabel>
                                            <div className="relative">
                                                <FormControl><Input placeholder="123-456-7890" {...field} className={field.value ? "pr-10" : ""} /></FormControl>
                                                {field.value && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" asChild><a href={`tel:${field.value}`}><Phone className="h-4 w-4" /><span className="sr-only">Call Business</span></a></Button>}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="cellPhone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cell #</FormLabel>
                                            <div className="relative">
                                                <FormControl><Input placeholder="123-456-7890" {...field} className={field.value ? "pr-10" : ""} /></FormControl>
                                                {field.value && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" asChild><a href={`tel:${field.value}`}><Phone className="h-4 w-4" /><span className="sr-only">Call Cell</span></a></Button>}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="homePhone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Home #</FormLabel>
                                            <div className="relative">
                                                <FormControl><Input placeholder="123-456-7890" {...field} className={field.value ? "pr-10" : ""} /></FormControl>
                                                {field.value && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" asChild><a href={`tel:${field.value}`}><Phone className="h-4 w-4" /><span className="sr-only">Call Home</span></a></Button>}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="faxNumber" render={({ field }) => ( <FormItem> <FormLabel>Fax #</FormLabel> <FormControl><Input placeholder="123-456-7890" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="primaryPhoneType"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>Primary Phone Number</FormLabel>
                                            <FormDescription>Select the best number to use for this contact.</FormDescription>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-2 has-[:disabled]:opacity-50">
                                                        <FormControl><RadioGroupItem value="businessPhone" disabled={!form.getValues().businessPhone} /></FormControl>
                                                        <FormLabel className="font-normal w-full cursor-pointer">Business</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-2 has-[:disabled]:opacity-50">
                                                        <FormControl><RadioGroupItem value="cellPhone" disabled={!form.getValues().cellPhone} /></FormControl>
                                                        <FormLabel className="font-normal w-full cursor-pointer">Cell</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-2 has-[:disabled]:opacity-50">
                                                        <FormControl><RadioGroupItem value="homePhone" disabled={!form.getValues().homePhone} /></FormControl>
                                                        <FormLabel className="font-normal w-full cursor-pointer">Home</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notes</FormLabel>
                                            <div className="relative">
                                                <FormControl><Textarea
                                                    placeholder="Reference to information regarding the client.."
                                                    className="resize-none pr-10"
                                                    rows={5}
                                                    {...field}
                                                    ref={notesRef}
                                                /></FormControl>
                                                <Button type="button" variant={isListening ? 'destructive' : 'ghost'} size="icon" className="absolute bottom-2 right-2 h-8 w-8" onClick={handleDictateNotes} disabled={isSupported === false} title={isSupported === false ? "Voice not supported" : (isListening ? "Stop dictation" : "Dictate notes")}>
                                                    {isListening ? <Square className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                                                    <span className="sr-only">{isListening ? "Stop dictation" : "Dictate notes"}</span>
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </ScrollArea>
                        <SheetFooter className="p-6 border-t">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit">{contactToEdit ? "Save Changes" : "Create Contact"}</Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
