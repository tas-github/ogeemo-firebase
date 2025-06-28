
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  Users,
  LoaderCircle,
  ChevronRight,
  FolderPlus
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
  DropdownMenuSeparator
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Contact, type FolderData } from '@/data/contacts';
import { useToast } from '@/hooks/use-toast';
import { addFolder, getContacts, getFolders, deleteContacts, addContact, updateContact, updateFolder, deleteFolderAndContents } from '@/services/contact-service';
import { useAuth } from '@/context/auth-context';
import { getGoogleContacts, type GoogleContact } from '@/services/google-service';
import { cn } from '@/lib/utils';

const ContactFormDialog = dynamic(() => import('@/components/contacts/contact-form-dialog'), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <LoaderCircle className="h-10 w-10 animate-spin text-white" />
    </div>
  ),
});

const GoogleImportInstructionsDialog = dynamic(() => import('@/components/contacts/google-import-instructions-dialog'), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <LoaderCircle className="h-10 w-10 animate-spin text-white" />
    </div>
  ),
});


function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 mr-2">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.229-11.303-7.582l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.447-2.274 4.481-4.244 5.892l6.19 5.238C42.012 35.245 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
    )
}

const ItemTypes = {
  CONTACT: 'contact',
  FOLDER: 'folder',
};

type DroppableItem = (Contact & { type?: 'contact' }) | (FolderData & { type: 'folder' });


function ContactsViewContent() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderInitialParentId, setNewFolderInitialParentId] = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<FolderData | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([]);
  const [selectedGoogleContacts, setSelectedGoogleContacts] = useState<string[]>([]);
  const [folderToDelete, setFolderToDelete] = useState<FolderData | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const [showGoogleInstructions, setShowGoogleInstructions] = useState(true);
  const [isInstructionsDialogOpen, setIsInstructionsDialogOpen] = useState(false);

  const { toast } = useToast();
  const { user, accessToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    try {
      const hideInstructions = localStorage.getItem('hideGoogleImportInstructions') === 'true';
      if (hideInstructions) {
        setShowGoogleInstructions(false);
      }
    } catch (error) {
      console.error("Could not read from localStorage", error);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [fetchedFolders, fetchedContacts] = await Promise.all([
                getFolders(user.uid),
                getContacts(user.uid),
            ]);
            setFolders(fetchedFolders);
            setContacts(fetchedContacts);
            const rootFolder = fetchedFolders.find(f => !f.parentId);
            if(rootFolder) {
              setExpandedFolders(new Set([rootFolder.id]));
            }
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
  }, [toast, user]);

  const selectedFolder = useMemo(
    () => folders.find((f) => f && f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  const displayedContacts = useMemo(
    () => {
        if (selectedFolderId === 'all') return contacts;
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
    setSelectedContactIds(allVisibleSelected ? [] : displayedContacts.map(c => c.id));
  };
  
  const handleNewContactClick = () => {
    if (selectedFolderId === 'all') {
      toast({ variant: "destructive", title: "Folder Required", description: "Please select a specific folder before adding a contact." });
      return;
    }
    setContactToEdit(null);
    setIsContactFormOpen(true);
  };
  
  const handleSaveContact = async (data: Contact | Omit<Contact, 'id'>, isEditing: boolean) => {
    if (!user) return;
    try {
        if (isEditing) {
            const contact = data as Contact;
            await updateContact(contact.id, contact);
            setContacts(prev => prev.map(c => c.id === contact.id ? contact : c));
            toast({ title: "Contact Updated", description: `Details for ${contact.name} have been saved.` });
        } else {
            const newContactData = { ...data, userId: user.uid } as Omit<Contact, 'id'>;
            const newContact = await addContact(newContactData);
            setContacts(prev => [...prev, newContact]);
            toast({ title: "Contact Created", description: `${newContact.name} has been added.` });
        }
    } catch(error: any) {
        toast({ variant: "destructive", title: "Save failed", description: error.message });
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedContactIds.length === 0) return;
    try {
      await deleteContacts(selectedContactIds);
      setContacts(contacts.filter(c => !selectedContactIds.includes(c.id)));
      toast({ title: `${selectedContactIds.length} Contacts Deleted` });
      setSelectedContactIds([]);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    }
  };
  
  const handleOpenNewFolderDialog = (options: { parentId?: string | null } = {}) => {
    setNewFolderInitialParentId(options.parentId || null);
    setIsNewFolderDialogOpen(true);
  };
  
  const handleDeleteFolder = async () => {
    if (!user || !folderToDelete) return;
    try {
        await deleteFolderAndContents(user.uid, folderToDelete.id);
        const [refetchedFolders, refetchedContacts] = await Promise.all([
            getFolders(user.uid),
            getContacts(user.uid),
        ]);
        setFolders(refetchedFolders);
        setContacts(refetchedContacts);
        if(selectedFolderId === folderToDelete.id) setSelectedFolderId('all');
        toast({ title: "Folder Deleted" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    } finally {
        setFolderToDelete(null);
    }
  };

  const handleStartRename = (folder: FolderData) => {
    setRenamingFolder(folder);
    setRenameInputValue(folder.name);
  };

  const handleCancelRename = () => {
    setRenamingFolder(null);
    setRenameInputValue("");
  };

  const handleConfirmRename = async () => {
    if (!renamingFolder || !renameInputValue.trim() || renamingFolder.name === renameInputValue.trim()) {
      handleCancelRename();
      return;
    }

    try {
      await updateFolder(renamingFolder.id, { name: renameInputValue.trim() });
      setFolders(prev => prev.map(f => f.id === renamingFolder.id ? { ...f, name: renameInputValue.trim() } : f));
      toast({ title: "Folder Renamed" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Rename Failed", description: error.message });
    } finally {
      handleCancelRename();
    }
  };

  const startGoogleImportFlow = async () => {
    if (!accessToken) {
        setIsAuthDialogOpen(true);
        return;
    }
    setIsImportDialogOpen(true);
    setIsImportLoading(true);
    setGoogleContacts([]);
    setSelectedGoogleContacts([]);
    
    try {
        const result = await getGoogleContacts(accessToken);
        setGoogleContacts(result.contacts);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to fetch Google Contacts", description: error.message });
        setIsImportDialogOpen(false);
    } finally {
        setIsImportLoading(false);
    }
  };
  
  const handleOpenImportDialog = () => {
    if (showGoogleInstructions) {
        setIsInstructionsDialogOpen(true);
    } else {
        startGoogleImportFlow();
    }
  };
  
  const handleProceedFromInstructions = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
        try {
            localStorage.setItem('hideGoogleImportInstructions', 'true');
            setShowGoogleInstructions(false);
        } catch (error) {
            console.error("Could not write to localStorage", error);
        }
    }
    setIsInstructionsDialogOpen(false);
    startGoogleImportFlow();
  };

  const handleImportSelected = async () => {
    if (!user) return;
    let googleFolder = folders.find(f => f.name === "Google Contacts");
    if (!googleFolder) {
        googleFolder = await addFolder({ name: "Google Contacts", userId: user.uid, parentId: null });
        setFolders(prev => [...prev, googleFolder!]);
    }
    
    const contactsToImport = googleContacts.filter(gc => selectedGoogleContacts.includes(gc.resourceName));
    
    let importedCount = 0;
    const newOgeemoContacts: Contact[] = [];
    for (const gc of contactsToImport) {
        try {
            const newContactData: Omit<Contact, 'id'> = {
                name: gc.names?.[0]?.displayName || 'Unknown Name',
                email: gc.emailAddresses?.[0]?.value || '',
                businessPhone: gc.phoneNumbers?.find(p => p.type === 'work')?.value,
                cellPhone: gc.phoneNumbers?.find(p => p.type === 'mobile')?.value,
                homePhone: gc.phoneNumbers?.find(p => p.type === 'home')?.value,
                folderId: googleFolder.id,
                userId: user.uid,
                notes: `Imported from Google Contacts on ${new Date().toLocaleDateString()}`,
            };
            const newContact = await addContact(newContactData);
            newOgeemoContacts.push(newContact);
            importedCount++;
        } catch(e) { console.error("Failed to import contact", gc.names?.[0]?.displayName, e); }
    }
    
    setContacts(prev => [...prev, ...newOgeemoContacts]);
    toast({ title: "Import Complete", description: `Imported ${importedCount} contacts.` });
    setIsImportDialogOpen(false);
  }

  const handleContactDrop = async (contact: Contact, newFolderId: string) => {
    if (contact.folderId === newFolderId) return;

    try {
        await updateContact(contact.id, { folderId: newFolderId });
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, folderId: newFolderId } : c));
        const folder = folders.find(f => f.id === newFolderId);
        toast({ title: "Contact Moved", description: `"${contact.name}" moved to "${folder?.name}".` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Move Failed", description: error.message });
    }
  };

  const handleFolderDrop = async (folder: FolderData, newParentId: string | null) => {
    if (folder.id === newParentId) return; // Can't drop on self
    if (folder.parentId === newParentId) return; // Already in the target folder

    // Prevent dropping a folder into one of its own descendants
    let currentParentId = newParentId;
    while(currentParentId) {
        if (currentParentId === folder.id) {
            toast({ variant: "destructive", title: "Invalid Move", description: "You cannot move a folder into one of its own subfolders." });
            return;
        }
        const parent = folders.find(f => f.id === currentParentId);
        currentParentId = parent?.parentId || null;
    }

    try {
        await updateFolder(folder.id, { parentId: newParentId });
        setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, parentId: newParentId } : f));
        const parentFolder = folders.find(f => f.id === newParentId);
        toast({ title: "Folder Moved", description: `"${folder.name}" moved to "${parentFolder?.name || 'Root'}".` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Move Failed", description: error.message });
    }
  };

  const DraggableTableRow = ({ contact, children }: { contact: Contact, children: React.ReactNode }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.CONTACT,
        item: contact,
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }));
    return (
      <TableRow ref={drag} className={cn("cursor-pointer", isDragging && "opacity-50")} onClick={() => { setContactToEdit(contact); setIsContactFormOpen(true); }}>
        {children}
      </TableRow>
    );
  };

  const [{ canDropToRoot, isOverRoot }, dropToRoot] = useDrop(() => ({
      accept: ItemTypes.FOLDER,
      drop: (item: FolderData) => handleFolderDrop(item, null),
      collect: (monitor) => ({
          isOverRoot: monitor.isOver(),
          canDropToRoot: monitor.canDrop(),
      }),
  }));

  const FolderTree = ({ parentId = null, level = 0 }: { parentId?: string | null; level?: number }) => {
    const children = folders.filter(f => f.parentId === parentId).sort((a,b) => a.name.localeCompare(b.name));
    
    if (children.length === 0 && level === 0 && parentId === null) {
      return <p className="p-4 text-center text-sm text-muted-foreground">No folders yet. Create one to get started.</p>;
    }
    if (children.length === 0) return null;

    return (
      <div style={{ marginLeft: level > 0 ? '0.5rem' : '0' }}>
        {children.map(folder => {
          const hasChildren = folders.some(f => f.parentId === folder.id);
          const isExpanded = expandedFolders.has(folder.id);
          const isRenaming = renamingFolder?.id === folder.id;

          const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
            type: ItemTypes.FOLDER,
            item: { ...folder, type: ItemTypes.FOLDER },
            collect: (monitor) => ({ isDragging: monitor.isDragging() }),
          }));

          const [{ canDrop, isOver }, drop] = useDrop(() => ({
            accept: [ItemTypes.CONTACT, ItemTypes.FOLDER],
            drop: (item: DroppableItem) => {
              if (item.type === ItemTypes.FOLDER) {
                handleFolderDrop(item, folder.id);
              } else {
                handleContactDrop(item, folder.id);
              }
            },
            collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
          }));

          return (
            <div key={folder.id} className="my-1 rounded-md" ref={dragPreview}>
              <div
                ref={node => drag(drop(node))}
                className={cn(
                  "flex items-center gap-1 rounded-md pr-1 group",
                  isRenaming ? 'bg-background' : 'hover:bg-accent',
                  (isOver && canDrop) && 'bg-primary/20 ring-1 ring-primary',
                  isDragging && 'opacity-50'
                )}
                style={{ backgroundColor: selectedFolderId === folder.id && !isRenaming ? 'hsl(var(--accent))' : 'transparent' }}
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start gap-2 h-9 p-2 text-left"
                  onClick={() => { if (!isRenaming) setSelectedFolderId(folder.id) }}
                >
                  {hasChildren ? (
                    <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')} onClick={(e) => { e.stopPropagation(); setExpandedFolders(p => { const n = new Set(p); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; }); }} />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  <Folder className="h-4 w-4" />
                  {isRenaming ? (
                    <Input autoFocus value={renameInputValue} onChange={e => setRenameInputValue(e.target.value)} onBlur={handleConfirmRename} onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') handleCancelRename(); }} className="h-7" onClick={e => e.stopPropagation()} />
                  ) : (
                    <span className="truncate flex-1">{folder.name}</span>
                  )}
                </Button>
                {!isRenaming && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleOpenNewFolderDialog({ parentId: folder.id })}><FolderPlus className="mr-2 h-4 w-4" />Create subfolder</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleStartRename(folder)}><Pencil className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onSelect={() => setFolderToDelete(folder)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {isExpanded && <FolderTree parentId={folder.id} level={level + 1} />}
            </div>
          );
        })}
      </div>
    );
  };

  // The isLoading check is moved here, after all hooks have been defined.
  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center p-4"><LoaderCircle className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <header className="text-center py-4 sm:py-6 px-4 sm:px-6">
          <h1 className="text-3xl font-bold font-headline text-primary">Ogeemo Contact Manager</h1>
          <p className="text-muted-foreground">Manage your contacts and client relationships</p>
        </header>
        <div className="flex-1 min-h-0 pb-4 sm:pb-6">
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="flex h-full flex-col p-2">
                  <div className="p-2">
                    <Button className="w-full" onClick={() => handleOpenNewFolderDialog({ parentId: null })}>
                        <Plus className="mr-2 h-4 w-4" /> New Folder
                    </Button>
                  </div>
                  <ScrollArea ref={dropToRoot} className={cn("flex-1 rounded-md", isOverRoot && canDropToRoot && 'bg-primary/10 ring-1 ring-primary-foreground')}>
                    <nav className="flex flex-col gap-1 p-2">
                        <Button variant={selectedFolderId === 'all' ? "secondary" : "ghost"} className="w-full justify-start gap-3" onClick={() => setSelectedFolderId('all')}>
                            <Users className="h-4 w-4" /> <span>All Contacts</span>
                        </Button>
                        <FolderTree />
                    </nav>
                  </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
              <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b h-20">
                      {selectedContactIds.length > 0 ? (
                          <>
                              <h2 className="text-xl font-bold">{selectedContactIds.length} selected</h2>
                              <Button variant="destructive" onClick={handleDeleteSelected}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</Button>
                          </>
                      ) : (
                          <>
                              <div>
                                  <h2 className="text-xl font-bold">{selectedFolderId === 'all' ? 'All Contacts' : selectedFolder?.name}</h2>
                                  <p className="text-sm text-muted-foreground">{displayedContacts.length} contact(s)</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <Button variant="outline" onClick={handleOpenImportDialog} disabled={!user}><GoogleIcon /> Import from Google</Button>
                                  <Button onClick={handleNewContactClick}><Plus className="mr-2 h-4 w-4" /> New Contact</Button>
                              </div>
                          </>
                      )}
                  </div>
                   <div className="flex-1 overflow-y-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[50px]"><Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false} onCheckedChange={handleToggleSelectAll} /></TableHead>
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
                                const primaryPhoneNumber = contact.primaryPhoneType && contact[contact.primaryPhoneType] ? contact[contact.primaryPhoneType] : contact.cellPhone || contact.businessPhone || contact.homePhone;
                                return (
                                  <DraggableTableRow key={contact.id} contact={contact}>
                                      <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedContactIds.includes(contact.id)} onCheckedChange={() => handleToggleSelect(contact.id)} /></TableCell>
                                      <TableCell className="font-medium">{contact.name}</TableCell>
                                      <TableCell>{contact.email}</TableCell>
                                      <TableCell>{primaryPhoneNumber}</TableCell>
                                      {selectedFolderId === 'all' && <TableCell>{folderName}</TableCell>}
                                      <TableCell>
                                          <DropdownMenu>
                                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onSelect={() => { setContactToEdit(contact); setIsContactFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                  <DropdownMenuItem className="text-destructive" onSelect={async () => { await deleteContacts([contact.id]); setContacts(prev => prev.filter(c => c.id !== contact.id)); toast({ title: "Contact Deleted" }); }}> <Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                              </DropdownMenuContent>
                                          </DropdownMenu>
                                      </TableCell>
                                  </DraggableTableRow>
                                );
                              })}
                          </TableBody>
                      </Table>
                  </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
      
      {isContactFormOpen && <ContactFormDialog isOpen={isContactFormOpen} onOpenChange={setIsContactFormOpen} contactToEdit={contactToEdit} selectedFolderId={selectedFolderId} folders={folders} onSave={handleSaveContact} />}

      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-name-new">Name</Label>
              <Input id="folder-name-new" value={renameInputValue} onChange={(e) => setRenameInputValue(e.target.value)} onKeyDown={async (e) => { if (e.key === 'Enter') { if (!user || !renameInputValue.trim()) return; const newFolder = await addFolder({ name: renameInputValue, userId: user.uid, parentId: newFolderInitialParentId }); setFolders(prev => [...prev, newFolder]); if(newFolder.parentId) { setExpandedFolders(p => new Set(p).add(newFolder.parentId!)) }; setIsNewFolderDialogOpen(false); setRenameInputValue(''); } }} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
              <Button onClick={async () => { if (!user || !renameInputValue.trim()) return; const newFolder = await addFolder({ name: renameInputValue, userId: user.uid, parentId: newFolderInitialParentId }); setFolders(prev => [...prev, newFolder]); if(newFolder.parentId) { setExpandedFolders(p => new Set(p).add(newFolder.parentId!)) }; setIsNewFolderDialogOpen(false); setRenameInputValue(''); }}>Create</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
          <DialogContent><DialogHeader><DialogTitle>Authentication Required</DialogTitle><DialogDescription>To import contacts, you need to connect your Google account and grant permission. Please go to the Google Integration page to sign in.</DialogDescription></DialogHeader><DialogFooter><Button onClick={() => {setIsAuthDialogOpen(false); router.push('/google');}}>Go to Google Integration</Button></DialogFooter></DialogContent>
      </Dialog>
      
      <Dialog open={folderToDelete !== null} onOpenChange={() => setFolderToDelete(null)}>
          <DialogContent><DialogHeader><DialogTitle>Delete Folder</DialogTitle><DialogDescription>Are you sure you want to delete the "{folderToDelete?.name}" folder and all contacts within it? This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="ghost" onClick={() => setFolderToDelete(null)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteFolder}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
      
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col"><DialogHeader><DialogTitle>Import Google Contacts</DialogTitle><DialogDescription>Select contacts to import into a "Google Contacts" folder.</DialogDescription></DialogHeader>
          {isImportLoading ? <div className="flex-1 flex items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin" /></div> : <ScrollArea className="flex-1 -mx-6 my-4 border-y"><div className="p-4 space-y-1">{googleContacts.map(contact => (<div key={contact.resourceName} className="flex items-center p-2 rounded-md hover:bg-accent space-x-3"><Checkbox id={contact.resourceName} checked={selectedGoogleContacts.includes(contact.resourceName)} onCheckedChange={() => setSelectedGoogleContacts(p => p.includes(contact.resourceName) ? p.filter(rn => rn !== contact.resourceName) : [...p, contact.resourceName])} /><Label htmlFor={contact.resourceName} className="flex-1 cursor-pointer"><p className="font-semibold">{contact.names?.[0]?.displayName || 'N/A'}</p><p className="text-sm text-muted-foreground">{contact.emailAddresses?.[0]?.value || 'No email'}</p></Label></div>))}</div></ScrollArea>}
          <DialogFooter><Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button><Button onClick={handleImportSelected} disabled={isImportLoading || selectedGoogleContacts.length === 0}>Import ({selectedGoogleContacts.length})</Button></DialogFooter>
          </DialogContent>
      </Dialog>
      
      {isInstructionsDialogOpen && (
        <GoogleImportInstructionsDialog
          isOpen={isInstructionsDialogOpen}
          onOpenChange={setIsInstructionsDialogOpen}
          onProceed={handleProceedFromInstructions}
        />
      )}
    </>
  );
}

export function ContactsView() {
    return (
        <DndProvider backend={HTML5Backend}>
            <ContactsViewContent />
        </DndProvider>
    )
}
