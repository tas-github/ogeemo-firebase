
"use client";

import { useEffect, useState, useRef } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Mic, Square, FolderPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from '@/components/ui/textarea';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { useToast } from '@/hooks/use-toast';
import { type Contact, type FolderData } from '@/data/contacts';
import { ScrollArea } from '../ui/scroll-area';
import { addContact, updateContact, addFolder } from '@/services/contact-service';
import { useAuth } from '@/context/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useUserPreferences } from '@/hooks/use-user-preferences';

const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  businessPhone: z.string().optional(),
  cellPhone: z.string().optional(),
  homePhone: z.string().optional(),
  faxNumber: z.string().optional(),
  primaryPhoneType: z.enum(['businessPhone', 'cellPhone', 'homePhone']).nullable().default(null),
  notes: z.string().optional(),
  folderId: z.string({ required_error: "Please select a folder." }).min(1, { message: "Folder is required." }),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    contactToEdit: Contact | null;
    folders: FolderData[];
    onSave: (contact: Contact, isEditing: boolean) => void;
    selectedFolderId?: string; // Add this to pass the currently selected folder
}

export default function ContactFormDialog({
    isOpen,
    onOpenChange,
    contactToEdit,
    folders,
    onSave,
    selectedFolderId,
}: ContactFormDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [notesBeforeSpeech, setNotesBeforeSpeech] = useState('');
    const notesRef = useRef<HTMLTextAreaElement>(null);
    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [currentFolders, setCurrentFolders] = useState<FolderData[]>(folders);
    const { preferences } = useUserPreferences();

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: { name: "", email: "", businessPhone: "", cellPhone: "", homePhone: "", faxNumber: "", primaryPhoneType: null, notes: "", folderId: "" },
    });
    
    // Watch phone number fields to dynamically enable/disable radio buttons
    const businessPhoneValue = form.watch('businessPhone');
    const cellPhoneValue = form.watch('cellPhone');
    const homePhoneValue = form.watch('homePhone');

    useEffect(() => {
        // Only reset form when dialog opens. Prevents infinite loops.
        if (isOpen) {
            setCurrentFolders(folders);
            const defaultFolderId = selectedFolderId !== 'all' ? selectedFolderId : (folders.find(f => f.name === 'Clients')?.id || folders[0]?.id || '');
            const initialValues = contactToEdit 
                ? { ...contactToEdit, folderId: contactToEdit.folderId || defaultFolderId, primaryPhoneType: contactToEdit.primaryPhoneType || null } 
                : { name: "", email: "", businessPhone: "", cellPhone: "", homePhone: "", faxNumber: "", primaryPhoneType: null, notes: "", folderId: defaultFolderId };
            form.reset(initialValues);
        }
    }, [isOpen, contactToEdit, folders, selectedFolderId, form]);

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
        if (!user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save a contact." });
            return;
        }

        const dataToSave = {
            ...values,
            primaryPhoneType: values.primaryPhoneType || null,
        };

        try {
            if (contactToEdit) {
                const updatedContactData = { ...contactToEdit, ...dataToSave };
                await updateContact(contactToEdit.id, updatedContactData);
                onSave(updatedContactData, true);
                toast({ title: "Contact Updated", description: `Details for ${values.name} have been saved.` });
            } else {
                const newContactData: Omit<Contact, 'id'> = {
                    ...dataToSave,
                    email: dataToSave.email || '',
                    userId: user.uid,
                };
                const newContact = await addContact(newContactData);
                onSave(newContact, false);
                toast({ title: "Contact Created", description: `${newContact.name} has been added.` });
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

    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;
        try {
            const newFolder = await addFolder({ name: newFolderName, userId: user.uid, parentId: null });
            setCurrentFolders(prev => [...prev, newFolder]);
            form.setValue('folderId', newFolder.id);
            toast({ title: "Folder Created" });
        } catch(e: any) { toast({ variant: "destructive", title: "Failed", description: (e as Error).message }); }
        finally { setIsNewFolderDialogOpen(false); setNewFolderName(""); }
    };

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b text-center sm:text-center">
                    <DialogTitle className="text-2xl font-bold font-headline text-primary">
                        {contactToEdit ? "Edit Contact" : "New Contact"}
                    </DialogTitle>
                    <DialogDescription>
                        {contactToEdit ? `Editing details for ${contactToEdit.name}.` : `Create a new contact.`}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1">
                            <div className="px-6 pb-4 space-y-4 bg-card">
                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Name <span className="text-destructive">*</span></FormLabel> <FormControl><Input placeholder="John Doe" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                
                                <FormField
                                    control={form.control}
                                    name="folderId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Folder <span className="text-destructive">*</span></FormLabel>
                                        <div className="flex gap-2">
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select a folder" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {currentFolders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button type="button" variant="outline" size="icon" onClick={() => setIsNewFolderDialogOpen(true)}>
                                                <FolderPlus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

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
                                            <FormLabel>Best number to use</FormLabel>
                                            <FormDescription>Select the best number to use for this contact.</FormDescription>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} value={field.value || ""} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-2">
                                                        <FormControl><RadioGroupItem value="businessPhone" disabled={!businessPhoneValue} /></FormControl>
                                                        <FormLabel className="font-normal w-full cursor-pointer">Business</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-2">
                                                        <FormControl><RadioGroupItem value="cellPhone" disabled={!cellPhoneValue} /></FormControl>
                                                        <FormLabel className="font-normal w-full cursor-pointer">Cell</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-2">
                                                        <FormControl><RadioGroupItem value="homePhone" disabled={!homePhoneValue} /></FormControl>
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
                                                {preferences?.showDictationButton && (
                                                    <Button type="button" variant={isListening ? 'destructive' : 'ghost'} size="icon" className="absolute bottom-2 right-2 h-8 w-8" onClick={handleDictateNotes} disabled={isSupported === false} title={isSupported === false ? "Voice not supported" : (isListening ? "Stop dictation" : "Dictate notes")}>
                                                        {isListening ? <Square className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                                                        <span className="sr-only">{isListening ? "Stop dictation" : "Dictate notes"}</span>
                                                    </Button>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </ScrollArea>
                        <DialogFooter className="p-6 border-t">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit">{contactToEdit ? "Save Changes" : "Create Contact"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-name-new">Name</Label>
              <Input id="folder-name-new" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={async (e) => { if (e.key === 'Enter') handleCreateFolder() }} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder}>Create</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      </>
    );
}
