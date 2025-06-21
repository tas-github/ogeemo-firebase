
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  File,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Strikethrough,
  Quote,
  Link as LinkIcon,
  ChevronDown,
  Minus,
  Code2,
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
import {
  type Contact,
  type FolderData,
  mockContacts,
  mockFolders,
} from '@/data/contacts';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().optional(),
});


export default function ContactsPage() {
  const [folders, setFolders] = useState<FolderData[]>(() => [...mockFolders]);
  const [contacts, setContacts] = useState<Contact[]>(() => [...mockContacts]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(mockFolders[0]?.id || null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [viewedContactId, setViewedContactId] = useState<string | null>(null);

  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [isNewContactDialogOpen, setIsNewContactDialogOpen] = useState(false);
  
  const [notes, setNotes] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  const displayedContacts = useMemo(
    () => contacts.filter((c) => c.folderId === selectedFolderId),
    [contacts, selectedFolderId]
  );

  const viewedContact = useMemo(
    () => contacts.find((c) => c.id === viewedContactId),
    [contacts, viewedContactId]
  );

  const allVisibleSelected = displayedContacts.length > 0 && selectedContactIds.length === displayedContacts.length;
  const someVisibleSelected = selectedContactIds.length > 0 && selectedContactIds.length < displayedContacts.length;
  
  useEffect(() => {
    if (viewedContact) {
      setNotes(viewedContact.notes || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = viewedContact.notes || '';
      }
    } else {
      setNotes('');
       if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  }, [viewedContact]);

  useEffect(() => {
    // When folder changes, clear the viewed contact
    setViewedContactId(null);
  }, [selectedFolderId]);


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

  const handleToggleSelect = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedContactIds.length === displayedContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(displayedContacts.map((c) => c.id));
    }
  };

  const handleDeleteSelected = () => {
    setContacts(contacts.filter(c => !selectedContactIds.includes(c.id)));
    setSelectedContactIds([]);
    setViewedContactId(null); // Clear detail view if deleted
  }

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedContactIds([]);
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleCreateLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast({
          variant: "destructive",
          title: "Cannot Create Link",
          description: "Please select the text you want to hyperlink.",
      });
      return;
    }
    const url = window.prompt("Enter the URL:");
    if (url) {
      handleFormat('createLink', url);
    }
  };

  const preventDefault = (e: React.MouseEvent) => e.preventDefault();

  const handleSaveNotes = () => {
    if (!viewedContactId) return;

    setContacts(prevContacts =>
        prevContacts.map(c =>
            c.id === viewedContactId ? { ...c, notes } : c
        )
    );
    toast({
      title: "Notes Saved",
      description: `Notes for ${viewedContact?.name} have been updated.`,
    })
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
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
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

              <ResizablePanel defaultSize={30} minSize={25}>
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
                                            <TableHead className="w-[50px]"> <Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false} onCheckedChange={handleToggleSelectAll} aria-label="Select all" /> </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayedContacts.map((contact) => (
                                            <TableRow key={contact.id} data-state={selectedContactIds.includes(contact.id) && "selected"} onClick={() => setViewedContactId(contact.id)} className="cursor-pointer">
                                                <TableCell onClick={(e) => e.stopPropagation()}> <Checkbox checked={selectedContactIds.includes(contact.id)} onCheckedChange={() => handleToggleSelect(contact.id)} aria-label={`Select ${contact.name}`} /> </TableCell>
                                                <TableCell className="font-medium">{contact.name}</TableCell>
                                                <TableCell>{contact.email}</TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild> <Button variant="ghost" size="icon"> <MoreVertical className="h-4 w-4" /> </Button> </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem> <Pencil className="mr-2 h-4 w-4" /> Edit </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive"> <Trash2 className="mr-2 h-4 w-4" /> Delete </DropdownMenuItem>
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
                        <div className="flex h-full items-center justify-center p-4 text-center">
                            <p className="text-muted-foreground">Select or create a folder to get started.</p>
                        </div>
                    )}
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex flex-col h-full">
                    {viewedContact ? (
                        <>
                            <div className="flex items-center gap-4 p-4 border-b">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>{viewedContact.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold">{viewedContact.name}</h2>
                                    <p className="text-sm text-muted-foreground">{viewedContact.email}</p>
                                    {viewedContact.phone && <p className="text-sm text-muted-foreground">{viewedContact.phone}</p>}
                                </div>
                            </div>
                            <div className="p-2 border-b flex items-center gap-1 flex-wrap">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8">Headings<ChevronDown className="h-4 w-4 ml-2" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => handleFormat('formatBlock', 'p')}>Paragraph</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleFormat('formatBlock', 'h3')} className="text-lg font-bold">Heading 3</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleFormat('formatBlock', 'h4')} className="text-base font-bold">Heading 4</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8">Insert<ChevronDown className="h-4 w-4 ml-2" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onMouseDown={preventDefault} onSelect={() => handleFormat('insertHorizontalRule')}><Minus className="mr-2 h-4 w-4" />Horizontal Line</DropdownMenuItem>
                                        <DropdownMenuItem onMouseDown={preventDefault} onSelect={() => handleFormat('formatBlock', 'pre')}><Code2 className="mr-2 h-4 w-4" />Code Block</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Strikethrough" onMouseDown={preventDefault} onClick={() => handleFormat('strikeThrough')}><Strikethrough className="h-4 w-4" /></Button>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Blockquote" onMouseDown={preventDefault} onClick={() => handleFormat('formatBlock', 'blockquote')}><Quote className="h-4 w-4" /></Button>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Insert Link" onMouseDown={preventDefault} onClick={handleCreateLink}><LinkIcon className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div
                                    ref={editorRef}
                                    className="prose dark:prose-invert max-w-none focus:outline-none min-h-full"
                                    contentEditable={true}
                                    onInput={(e) => setNotes(e.currentTarget.innerHTML)}
                                    dangerouslySetInnerHTML={{ __html: notes }}
                                    placeholder="Add notes for this contact..."
                                />
                            </div>
                            <div className="p-3 border-t flex justify-end">
                                <Button onClick={handleSaveNotes}><Save className="mr-2 h-4 w-4" /> Save Notes</Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-muted-foreground">Select a contact to view details.</p>
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
