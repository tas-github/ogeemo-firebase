
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
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Save,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { type Contact, type FolderData, mockContacts, mockFolders } from '@/data/contacts';

const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().optional(),
});


export default function ContactsPage() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [currentNotes, setCurrentNotes] = useState('');

  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isNewContactDialogOpen, setIsNewContactDialogOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });
  
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
  
  const selectedContact = useMemo(
    () => contacts.find(c => c.id === selectedContactId),
    [contacts, selectedContactId]
  );

  // Update editor when selected contact changes
  useEffect(() => {
    if (selectedContact) {
        setCurrentNotes(selectedContact.notes);
        if (editorRef.current) {
            editorRef.current.innerHTML = selectedContact.notes;
        }
    } else {
        setCurrentNotes('');
         if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
    }
  }, [selectedContact]);
  
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
  
  function handleCreateContact(values: z.infer<typeof contactSchema>) {
    if (!selectedFolderId) return;
    const newContact: Contact = {
      id: `c-${Date.now()}`,
      folderId: selectedFolderId,
      name: values.name,
      email: values.email,
      phone: values.phone || '',
      notes: '',
    };
    const newContacts = [...contacts, newContact];
    setContacts(newContacts);
    form.reset();
    setIsNewContactDialogOpen(false);
  }
  
  const handleDeleteSelected = () => {
    const contactsToKeep = contacts.filter(c => !selectedContactIds.includes(c.id));
    setContacts(contactsToKeep);
    // If the currently viewed contact is deleted, clear the view
    if (selectedContactId && selectedContactIds.includes(selectedContactId)) {
        const nextContact = displayedContacts.find(c => !selectedContactIds.includes(c.id));
        setSelectedContactId(nextContact ? nextContact.id : null);
    }
    setSelectedContactIds([]);
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedContactId(null); // Deselect contact when changing folder
    setSelectedContactIds([]);
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
  }
  
  // Editor handlers
  const handleSaveNotes = () => {
    if (!selectedContactId) return;
    setContacts(prevContacts =>
        prevContacts.map(contact =>
            contact.id === selectedContactId ? { ...contact, notes: currentNotes } : contact
        )
    );
    toast({ title: "Notes saved successfully!" });
  };

  const preventDefault = (e: React.MouseEvent) => e.preventDefault();
  
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleCreateLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select text to create a link."});
      return;
    }
    const url = window.prompt("Enter the URL:");
    if (url) {
      handleFormat('createLink', url);
    }
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
              <ResizablePanel defaultSize={20} minSize={15}>
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
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateFolder}>Create Folder</Button>
                                </DialogFooter>
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
              <ResizablePanel defaultSize={35} minSize={25}>
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
                                        <Dialog open={isNewContactDialogOpen} onOpenChange={(open) => { setIsNewContactDialogOpen(open); if (!open) form.reset(); }}>
                                            <DialogTrigger asChild>
                                                <Button disabled={!selectedFolderId}>
                                                <Plus className="mr-2 h-4 w-4" /> New Contact
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Create New Contact</DialogTitle>
                                                    <DialogDescription>
                                                        Add a new contact to the "{selectedFolder.name}" folder.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <Form {...form}>
                                                    <form onSubmit={form.handleSubmit(handleCreateContact)} className="space-y-4 py-4">
                                                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Name</FormLabel> <FormControl><Input placeholder="John Doe" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                                        <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem> <FormLabel>Phone (Optional)</FormLabel> <FormControl><Input placeholder="123-456-7890" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                                        <DialogFooter className="pt-4">
                                                            <Button type="button" variant="ghost" onClick={() => setIsNewContactDialogOpen(false)}>Cancel</Button>
                                                            <Button type="submit">Create Contact</Button>
                                                        </DialogFooter>
                                                    </form>
                                                </Form>
                                            </DialogContent>
                                        </Dialog>
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
                                            <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayedContacts.map((contact) => (
                                            <TableRow 
                                                key={contact.id} 
                                                data-state={selectedContactId === contact.id ? 'selected' : undefined}
                                                onClick={() => handleContactSelect(contact.id)}
                                            >
                                                <TableCell onClick={(e) => e.stopPropagation()}> 
                                                    <Checkbox 
                                                        checked={selectedContactIds.includes(contact.id)} 
                                                        onCheckedChange={() => handleToggleSelect(contact.id)} 
                                                        aria-label={`Select ${contact.name}`} 
                                                    /> 
                                                </TableCell>
                                                <TableCell className="font-medium">{contact.name}</TableCell>
                                                <TableCell>{contact.email}</TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem> <Pencil className="mr-2 h-4 w-4" /> Edit </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedContactIds([contact.id]); handleDeleteSelected()}}> <Trash2 className="mr-2 h-4 w-4" /> Delete </DropdownMenuItem>
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
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={45} minSize={30}>
                <div className="flex flex-col h-full">
                    {selectedContact ? (
                        <>
                            <div className="p-4 border-b h-20 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedContact.name}</h2>
                                    <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                                </div>
                                <Button onClick={handleSaveNotes}>
                                    <Save className="mr-2 h-4 w-4" /> Save Notes
                                </Button>
                            </div>
                            <div className="p-2 border-b flex items-center gap-1 flex-wrap">
                                <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Strikethrough" onMouseDown={preventDefault} onClick={() => handleFormat('strikeThrough')}><Strikethrough className="h-4 w-4" /></Button>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Blockquote" onMouseDown={preventDefault} onClick={() => handleFormat('formatBlock', 'blockquote')}><Quote className="h-4 w-4" /></Button>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <Button variant="ghost" size="icon" title="Insert Link" onMouseDown={preventDefault} onClick={handleCreateLink}><LinkIcon className="h-4 w-4" /></Button>
                            </div>
                             <div className="flex-1 overflow-y-auto p-4">
                                <div
                                    ref={editorRef}
                                    className="prose dark:prose-invert max-w-none focus:outline-none min-h-full h-full"
                                    contentEditable={true}
                                    onInput={(e) => setCurrentNotes(e.currentTarget.innerHTML)}
                                    dangerouslySetInnerHTML={{ __html: currentNotes }}
                                    placeholder="Add your notes here..."
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <p className="text-lg font-medium">No Contact Selected</p>
                                <p>Select a contact from the list to see their details and notes.</p>
                            </div>
                        </div>
                    )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
