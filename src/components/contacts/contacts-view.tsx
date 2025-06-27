
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  Phone,
  Users,
  LoaderCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { type Contact, type FolderData } from '@/data/contacts';
import { useToast } from '@/hooks/use-toast';
import { addFolder, getContacts, getFolders, deleteContacts } from '@/services/contact-service';

const ContactFormDialog = dynamic(() => import('@/components/contacts/contact-form-dialog'), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <LoaderCircle className="h-10 w-10 animate-spin text-white" />
    </div>
  ),
});

export function ContactsView() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [isSelectFolderDialogOpen, setIsSelectFolderDialogOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        try {
            const [fetchedFolders, fetchedContacts] = await Promise.all([
                getFolders(),
                getContacts(),
            ]);
            setFolders(fetchedFolders);
            setContacts(fetchedContacts);
        } catch (error: any) {
            console.error("Failed to load contact data:", error);
            toast({
                variant: "destructive",
                title: "Failed to load data",
                description: error.message || "Could not retrieve contacts and folders from the database.",
            });
        } finally {
            setIsLoading(false);
        }
    }
    loadData();
  }, [toast]);

  const selectedFolder = useMemo(
    () => folders.find((f) => f && f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  const displayedContacts = useMemo(
    () => {
        if (selectedFolderId === 'all') {
            return contacts;
        }
        return contacts.filter((c) => c.folderId === selectedFolderId);
    },
    [contacts, selectedFolderId]
  );
  
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

  const openContactForm = (contact: Contact | null) => {
    setContactToEdit(contact);
    setIsContactFormOpen(true);
  };
  
  const handleNewContactClick = () => {
    if (selectedFolderId === 'all') {
      setIsSelectFolderDialogOpen(true);
    } else {
      openContactForm(null);
    }
  };
  
  const handleSaveContact = (savedContact: Contact) => {
    const isEditing = contacts.some(c => c.id === savedContact.id);
    if (isEditing) {
      setContacts(contacts.map(c => c.id === savedContact.id ? savedContact : c));
    } else {
      setContacts(prev => [...prev, savedContact]);
    }
  };


  const handleDeleteContact = async (contactId: string) => {
    const contactToDelete = contacts.find(c => c.id === contactId);
    if (contactToDelete) {
      try {
        await deleteContacts([contactId]);
        setContacts(contacts.filter(c => c.id !== contactId));
        setSelectedContactIds(prev => prev.filter(id => id !== contactId));
        toast({ title: "Contact Deleted", description: `${contactToDelete.name} has been deleted.` });
      } catch (error: any) {
        console.error("Failed to delete contact:", error);
        toast({ variant: "destructive", title: "Failed to delete contact", description: error.message });
      }
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteContacts(selectedContactIds);
      setContacts(contacts.filter(c => !selectedContactIds.includes(c.id)));
      toast({ title: `${selectedContactIds.length} Contacts Deleted`, description: `The selected contacts have been removed.` });
      setSelectedContactIds([]);
    } catch (error: any) {
      console.error("Failed to delete selected contacts:", error);
      toast({ variant: "destructive", title: "Failed to delete contacts", description: error.message });
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const newFolder = await addFolder(newFolderName.trim());
        setFolders([...folders, newFolder]);
        setNewFolderName("");
        setIsNewFolderDialogOpen(false);
      } catch (error: any) {
        console.error("Failed to create folder:", error);
        toast({ variant: "destructive", title: "Failed to create folder", description: error.message });
      }
    }
  };
  
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedContactIds([]);
  };

  if (isLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Contacts...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="text-center py-4 sm:py-6 px-4 sm:px-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Ogeemo Contact Manager
        </h1>
        <p className="text-muted-foreground">
          Manage your contacts and client relationships
        </p>
      </header>
      <div className="flex-1 min-h-0 pb-4 sm:pb-6">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="flex h-full flex-col p-2">
                <div className="p-2">
                    <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
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
                        <Button className="w-full" onClick={() => setIsNewFolderDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> New Folder
                        </Button>
                    </Dialog>
                </div>
                <nav className="flex flex-col gap-1 p-2">
                    <Button
                        key="all-contacts"
                        variant={selectedFolderId === 'all' ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3"
                        onClick={() => handleFolderSelect('all')}
                    >
                        <Users className="h-4 w-4" />
                        <span>All Contacts</span>
                    </Button>
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
                                        <h2 className="text-xl font-bold">{selectedFolderId === 'all' ? 'All Contacts' : selectedFolder?.name}</h2>
                                        <p className="text-sm text-muted-foreground">
                                            {displayedContacts.length} contact(s)
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={handleNewContactClick}>
                                            <Plus className="mr-2 h-4 w-4" /> New Contact
                                        </Button>
                                    </div>
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
                                        {selectedFolderId === 'all' && <TableHead>Folder</TableHead>}
                                        <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedContacts.map((contact) => {
                                      const folderName = folders.find(f => f.id === contact.folderId)?.name || 'Unassigned';
                                      const primaryPhoneNumber =
                                        contact.primaryPhoneType && contact[contact.primaryPhoneType]
                                            ? contact[contact.primaryPhoneType]
                                            : contact.cellPhone || contact.businessPhone || contact.homePhone || contact.faxNumber;

                                      return (
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
                                            <TableCell>{primaryPhoneNumber}</TableCell>
                                            {selectedFolderId === 'all' && <TableCell>{folderName}</TableCell>}
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
                                      );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      <Dialog open={isSelectFolderDialogOpen} onOpenChange={setIsSelectFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Folder Required</DialogTitle>
            <DialogDescription>
              To create a new contact, you must first select an existing folder or create a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
                setIsSelectFolderDialogOpen(false);
            }}>
              Select Folder
            </Button>
            <Button onClick={() => {
                setIsSelectFolderDialogOpen(false);
                setIsNewFolderDialogOpen(true);
            }}>
              Create New Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isContactFormOpen && (
          <ContactFormDialog 
            isOpen={isContactFormOpen}
            onOpenChange={setIsContactFormOpen}
            contactToEdit={contactToEdit}
            selectedFolderId={selectedFolderId}
            folders={folders}
            onSave={handleSaveContact}
          />
      )}

    </div>
  );
}
