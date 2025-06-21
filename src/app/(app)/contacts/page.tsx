
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Mic,
  Square,
  Phone,
} from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { type Contact, type FolderData, mockContacts, mockFolders } from '@/data/contacts';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { useToast } from '@/hooks/use-toast';

const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  businessPhone: z.string().optional(),
  cellPhone: z.string().optional(),
  homePhone: z.string().optional(),
  faxNumber: z.string().optional(),
  notes: z.string().optional(),
});


export default function ContactsPage() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  
  const notesEditorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", businessPhone: "", cellPhone: "", homePhone: "", faxNumber: "", notes: "" },
  });

  const [notesBeforeSpeech, setNotesBeforeSpeech] = useState('');

  const { isListening, startListening, stopListening, isSupported } =
    useSpeechToText({
      onTranscript: (transcript) => {
        if (notesEditorRef.current) {
          const newContent = notesBeforeSpeech
            ? `${notesBeforeSpeech} ${transcript}`
            : transcript;
          
          notesEditorRef.current.innerHTML = newContent;
          form.setValue('notes', newContent, { shouldValidate: true, shouldDirty: true });

          const range = document.createRange();
          const sel = window.getSelection();
          if (sel) {
            range.selectNodeContents(notesEditorRef.current);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      },
       onFinalTranscript: () => {
        if (isListening) {
          stopListening();
        }
      }
    });

  useEffect(() => {
    if (isSupported === false) {
      toast({
        variant: "destructive",
        title: "Voice Input Not Supported",
        description: "Your browser does not support the Web Speech API.",
      });
    }
  }, [isSupported, toast]);

  const handleDictateClick = () => {
    if (isListening) {
      stopListening();
    } else {
      const currentNotes = form.getValues('notes') || '';
      setNotesBeforeSpeech(currentNotes);
      startListening();
      notesEditorRef.current?.focus();
    }
  };
  
  // Data loading and saving effects
  useEffect(() => {
    try {
      const storedFolders = localStorage.getItem('contactFolders');
      const initialFolders = storedFolders ? JSON.parse(storedFolders) : [...mockFolders];
      setFolders(initialFolders);
      
      if (!selectedFolderId && initialFolders.length > 0) {
        setSelectedFolderId(initialFolders[0].id);
      }

      const storedContacts = localStorage.getItem('contacts');
      const initialContacts = storedContacts ? JSON.parse(storedContacts) : [...mockContacts];
      setContacts(initialContacts);

    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setFolders([...mockFolders]);
      setContacts([...mockContacts]);
      if (mockFolders.length > 0) {
        setSelectedFolderId(mockFolders[0].id);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem('contactFolders', JSON.stringify(folders));
    }
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  // Derived state
  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  const displayedContacts = useMemo(
    () => contacts.filter((c) => c.folderId === selectedFolderId),
    [contacts, selectedFolderId]
  );
  
  // Selection handlers
  const allVisibleSelected = displayedContacts.length > 0 && selectedContactIds.length === displayedContacts.length;
  const someVisibleSelected = selectedContactIds.length > 0 && selectedContactIds.length < displayedContacts.length;
  
  const handleToggleSelect = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(displayedContacts.map(c => c.id));
    }
  };

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
    notesEditorRef.current?.focus();
  };

  const openContactForm = (contact: Contact | null) => {
    setContactToEdit(contact);
    form.reset(contact || { name: "", email: "", businessPhone: "", cellPhone: "", homePhone: "", faxNumber: "", notes: "" });
    setIsContactFormOpen(true);
  };

  const closeContactForm = () => {
    setIsContactFormOpen(false);
    setContactToEdit(null);
    if(isListening) {
      stopListening();
    }
    form.reset();
  };
  
  function onSubmit(values: z.infer<typeof contactSchema>) {
    if (contactToEdit) {
      // Update existing contact
      const updatedContacts = contacts.map(c =>
        c.id === contactToEdit.id ? { ...contactToEdit, ...values } : c
      );
      setContacts(updatedContacts);
      toast({ title: "Contact Updated", description: `Details for ${values.name} have been updated.` });
    } else {
      // Create new contact
      if (!selectedFolderId) return;
      const newContact: Contact = {
        id: `c-${Date.now()}`,
        folderId: selectedFolderId,
        ...values
      };
      setContacts([...contacts, newContact]);
      toast({ title: "Contact Created", description: `${values.name} has been added.` });
    }
    closeContactForm();
  }

  const handleDeleteContact = (contactId: string) => {
    const contactToDelete = contacts.find(c => c.id === contactId);
    if (contactToDelete) {
      setContacts(contacts.filter(c => c.id !== contactId));
      setSelectedContactIds(prev => prev.filter(id => id !== contactId));
      toast({ title: "Contact Deleted", description: `${contactToDelete.name} has been deleted.` });
    }
  };

  const handleDeleteSelected = () => {
    setContacts(contacts.filter(c => !selectedContactIds.includes(c.id)));
    toast({ title: `${selectedContactIds.length} Contacts Deleted`, description: `The selected contacts have been removed.` });
    setSelectedContactIds([]);
  };

  // CRUD handlers
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: FolderData = {
        id: `f-${Date.now()}`,
        name: newFolderName.trim(),
      };
      setFolders([...folders, newFolder]);
      setNewFolderName("");
      setIsNewFolderDialogOpen(false);
    }
  };
  
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedContactIds([]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 flex flex-col h-full">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Ogeemo Contact Manager
        </h1>
        <p className="text-muted-foreground">
          Manage your contacts and client relationships
        </p>
      </header>
      <div className="flex-1 min-h-0">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
              <ResizablePanel defaultSize={25} minSize={20}>
                <div className="flex h-full flex-col p-2">
                    <div className="p-2">
                        <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> New Folder
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Create New Folder</DialogTitle>
                                    <DialogDescription>
                                        Enter a name for your new contact folder.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="folder-name" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="folder-name"
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            className="col-span-3"
                                            placeholder="e.g., 'Family'"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleCreateFolder();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="p-6 pt-0 flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateFolder}>Create Folder</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <nav className="flex flex-col gap-1 p-2">
                        {folders.map((folder) => (
                            <Button
                                key={folder.id}
                                variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3"
                                onClick={() => handleFolderSelect(folder.id)}
                            >
                                <Folder className="h-4 w-4" />
                                <span>{folder.name}</span>
                            </Button>
                        ))}
                    </nav>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={75}>
                <div className="flex flex-col h-full">
                    {selectedFolder ? (
                        <>
                            <div className="flex items-center justify-between p-4 border-b h-20">
                                {selectedContactIds.length > 0 ? (
                                    <>
                                        <div>
                                            <h2 className="text-xl font-bold">{selectedContactIds.length} selected</h2>
                                        </div>
                                        <Button variant="destructive" onClick={handleDeleteSelected}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <h2 className="text-xl font-bold">{selectedFolder.name}</h2>
                                            <p className="text-sm text-muted-foreground">
                                                {displayedContacts.length} contact(s)
                                            </p>
                                        </div>
                                        <Button disabled={!selectedFolderId} onClick={() => openContactForm(null)}>
                                            <Plus className="mr-2 h-4 w-4" /> New Contact
                                        </Button>
                                    </>
                                )}
                            </div>
                             <div className="flex-1 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                              <Checkbox
                                                checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                                                onCheckedChange={handleToggleSelectAll}
                                                aria-label="Select all"
                                              />
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayedContacts.map((contact) => (
                                            <TableRow key={contact.id} onClick={() => openContactForm(contact)} className="cursor-pointer">
                                                <TableCell onClick={(e) => e.stopPropagation()}> 
                                                    <Checkbox 
                                                        checked={selectedContactIds.includes(contact.id)} 
                                                        onCheckedChange={() => handleToggleSelect(contact.id)} 
                                                        aria-label={`Select ${contact.name}`} 
                                                    /> 
                                                </TableCell>
                                                <TableCell className="font-medium">{contact.name}</TableCell>
                                                <TableCell>{contact.email}</TableCell>
                                                <TableCell>{contact.cellPhone || contact.businessPhone || contact.homePhone || contact.faxNumber}</TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => openContactForm(contact)}> <Pencil className="mr-2 h-4 w-4" /> Edit </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteContact(contact.id)}> <Trash2 className="mr-2 h-4 w-4" /> Delete </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-muted-foreground">Select or create a folder to get started.</p>
                        </div>
                    )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isContactFormOpen} onOpenChange={(open) => { if (!open) closeContactForm(); else setIsContactFormOpen(true); }}>
          <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-0">
              <div className="flex flex-col space-y-1.5 text-center p-6 pb-4 border-b">
                <h1 className="text-3xl font-bold font-headline text-primary">
                  {contactToEdit ? `Edit ${contactToEdit.name}` : "Create New Contact"}
                </h1>
                <p className="text-muted-foreground">
                  {contactToEdit ? "Update the contact's details below." : `Add a new contact to the "${selectedFolder?.name}" folder.`}
                </p>
              </div>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-left">
                          <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Name</FormLabel> <FormControl><Input placeholder="John Doe" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                          <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="businessPhone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business #</FormLabel>
                                    <div className="relative">
                                        <FormControl>
                                            <Input placeholder="123-456-7890" {...field} className={field.value ? "pr-10" : ""} />
                                        </FormControl>
                                        {field.value && (
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" asChild>
                                                <a href={`tel:${field.value}`}><Phone className="h-4 w-4" /><span className="sr-only">Call Business</span></a>
                                            </Button>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="cellPhone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cell #</FormLabel>
                                     <div className="relative">
                                        <FormControl>
                                            <Input placeholder="123-456-7890" {...field} className={field.value ? "pr-10" : ""} />
                                        </FormControl>
                                        {field.value && (
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" asChild>
                                                <a href={`tel:${field.value}`}><Phone className="h-4 w-4" /><span className="sr-only">Call Cell</span></a>
                                            </Button>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="homePhone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Home #</FormLabel>
                                     <div className="relative">
                                        <FormControl>
                                            <Input placeholder="123-456-7890" {...field} className={field.value ? "pr-10" : ""} />
                                        </FormControl>
                                        {field.value && (
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" asChild>
                                                <a href={`tel:${field.value}`}><Phone className="h-4 w-4" /><span className="sr-only">Call Home</span></a>
                                            </Button>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="faxNumber" render={({ field }) => ( <FormItem> <FormLabel>Fax #</FormLabel> <FormControl><Input placeholder="123-456-7890" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <div className="rounded-md border">
                                  <div className="p-1 border-b flex items-center gap-1 flex-wrap">
                                      <Button type="button" variant="ghost" size="icon" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                                      <Button type="button" variant="ghost" size="icon" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                                      <Button type="button" variant="ghost" size="icon" title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                                      <Button type="button" variant="ghost" size="icon" title="Unordered List" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                                      <Button type="button" variant="ghost" size="icon" title="Ordered List" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                                  </div>
                                  <FormControl>
                                    <div
                                      ref={notesEditorRef}
                                      className="prose dark:prose-invert max-w-none min-h-[240px] p-2 focus:outline-none"
                                      contentEditable
                                      onInput={(e) => field.onChange(e.currentTarget.innerHTML)}
                                      onBlur={field.onBlur}
                                      dangerouslySetInnerHTML={{ __html: field.value ?? "" }}
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>

                      <div className="p-6 border-t flex items-center">
                          <div className="mr-auto">
                            {isListening ? (
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDictateClick}
                                className="animate-pulse"
                                title="Stop dictating"
                              >
                                <Square className="mr-2 h-4 w-4" />
                                Stop
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleDictateClick}
                                disabled={isSupported === false}
                                title={isSupported === false ? "Voice input not supported" : "Dictate notes"}
                              >
                                <Mic className="mr-2 h-4 w-4" />
                                Dictate Notes
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                              <Button type="button" variant="ghost" onClick={closeContactForm}>Cancel</Button>
                              <Button type="submit">{contactToEdit ? "Save Changes" : "Create Contact"}</Button>
                          </div>
                      </div>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
