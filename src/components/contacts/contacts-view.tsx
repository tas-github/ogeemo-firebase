
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDrag, useDrop } from 'react-dnd';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  Users,
  LoaderCircle,
  ChevronRight,
  FolderPlus,
  BookOpen,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Contact, type FolderData } from '@/data/contacts';
import { useToast } from '@/hooks/use-toast';
import { addFolder, getContacts, getFolders, deleteContacts, addContact, updateContact, updateFolder, deleteFoldersAndContents } from '@/services/contact-service';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ContactFormDialog = dynamic(() => import('@/components/contacts/contact-form-dialog'), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <LoaderCircle className="h-10 w-10 animate-spin text-white" />
    </div>
  ),
});

const ItemTypes = {
  CONTACT: 'contact',
  FOLDER: 'folder',
};

type DroppableItem = (Contact & { type?: 'contact' }) | (FolderData & { type: 'folder' });


export function ContactsView() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderInitialParentId, setNewFolderInitialParentId] = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<FolderData | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  
  const [folderToDelete, setFolderToDelete] = useState<FolderData | null>(null);
  const [foldersToDelete, setFoldersToDelete] = useState<string[] | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [{ canDropToRoot, isOverRoot }, dropToRoot] = useDrop(() => ({
      accept: ItemTypes.FOLDER,
      drop: (item: FolderData) => handleFolderDrop(item, null),
      collect: (monitor) => ({
          isOverRoot: monitor.isOver(),
          canDropToRoot: monitor.canDrop(),
      }),
  }));

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

            const action = searchParams.get('action');
            if (action === 'new') {
                handleNewContactClick();
                // Clean the URL
                router.replace('/contacts', { scroll: false });
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
  }, [toast, user, searchParams, router]);

  const selectedFolder = useMemo(
    () => folders.find((f) => f && f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  const displayedContacts = useMemo(
    () => {
        if (selectedFolderId === 'all') return contacts;
        const getDescendantFolderIds = (folderId: string): string[] => {
            let ids = [folderId];
            const children = folders.filter(f => f.parentId === folderId);
            children.forEach(child => {
                ids = [...ids, ...getDescendantFolderIds(child.id)];
            });
            return ids;
        };

        const folderIdsToDisplay = getDescendantFolderIds(selectedFolderId);
        return contacts.filter((c) => folderIdsToDisplay.includes(c.folderId));
    },
    [contacts, folders, selectedFolderId]
  );
  
  const allVisibleSelected = displayedContacts.length > 0 && selectedContactIds.length === displayedContacts.length;
  const someVisibleSelected = selectedContactIds.length > 0 && selectedContactIds.length < displayedContacts.length;
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
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
  
  const handleToggleFolderSelection = (folderId: string) => {
    setSelectedFolderIds(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };
  
  const handleNewContactClick = useCallback(() => {
    if (selectedFolderId === 'all' && folders.length > 0) {
      toast({ variant: "destructive", title: "Folder Required", description: "Please select a specific folder before adding a new contact." });
      return;
    }
    setContactToEdit(null);
    setIsContactFormOpen(true);
  }, [selectedFolderId, folders.length, toast]);
  
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
    if (!window.confirm(`Are you sure you want to delete ${selectedContactIds.length} contact(s)? This action cannot be undone.`)) return;

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
  
  const handleDeleteFolder = async (folder: FolderData) => {
      setFolderToDelete(folder);
  };
  
  const handleDeleteSelectedFolders = () => {
    if (selectedFolderIds.length === 0) return;
    setFoldersToDelete(selectedFolderIds);
  };

  const handleConfirmDelete = async () => {
    if (!user) return;
    const idsToDelete = foldersToDelete || (folderToDelete ? [folderToDelete.id] : []);
    if (idsToDelete.length === 0) return;

    try {
        await deleteFoldersAndContents(user.uid, idsToDelete);
        
        setFolders(prev => prev.filter(f => !idsToDelete.includes(f.id)));
        setContacts(prev => prev.filter(c => !idsToDelete.includes(c.folderId)));
        
        if (idsToDelete.includes(selectedFolderId)) setSelectedFolderId('all');
        setSelectedFolderIds([]);
        
        toast({ title: `${idsToDelete.length} Folder(s) Deleted` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    } finally {
        setFolderToDelete(null);
        setFoldersToDelete(null);
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
      <TableRow ref={drag} className={cn(isDragging && "opacity-50")}>
        {children}
      </TableRow>
    );
  };

  const FolderTree = ({ parentId = null, level = 0 }: { parentId?: string | null; level?: number }) => {
    const children = folders.filter(f => f.parentId === parentId).sort((a,b) => a.name.localeCompare(b.name));
    
    if (children.length === 0 && level === 0 && parentId === null) {
      return <p className="p-4 text-center text-sm text-muted-foreground">No folders yet. Create one to get started.</p>;
    }
    
    if (children.length === 0) return null;

    return (
      <div style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
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
                <div className="flex items-center pl-2">
                  <Checkbox
                    checked={selectedFolderIds.includes(folder.id)}
                    onCheckedChange={() => handleToggleFolderSelection(folder.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select folder ${folder.name}`}
                  />
                </div>
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
                  <Folder className={cn('h-4 w-4', folder.parentId ? 'text-green-500' : 'text-blue-500')} />
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
                      <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteFolder(folder)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
              <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between p-2 border-b h-[57px]">
                      {selectedFolderIds.length > 0 ? (
                        <>
                          <h3 className="text-sm font-semibold px-2">{selectedFolderIds.length} folder(s) selected</h3>
                          <Button variant="destructive" size="sm" onClick={handleDeleteSelectedFolders}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </>
                      ) : (
                         <>
                            <h3 className="text-lg font-semibold px-2">Folders</h3>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenNewFolderDialog({ parentId: null })} title="New Root Folder">
                                <FolderPlus className="h-5 w-5" />
                                <span className="sr-only">New Root Folder</span>
                            </Button>
                         </>
                      )}
                  </div>
                  <ScrollArea ref={dropToRoot} className={cn("flex-1 rounded-md p-2", isOverRoot && canDropToRoot && 'bg-primary/10 ring-1 ring-primary-foreground')}>
                      <Button variant={selectedFolderId === 'all' ? "secondary" : "ghost"} className="w-full justify-start gap-3 my-1" onClick={() => setSelectedFolderId('all')}>
                          <Users className="h-4 w-4" /> <span>All Contacts</span>
                      </Button>
                      <FolderTree />
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
                              <div className="flex items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedFolderId === 'all' ? 'All Contacts' : selectedFolder?.name}</h2>
                                    <p className="text-sm text-muted-foreground">{displayedContacts.length} contact(s)</p>
                                </div>
                                {selectedFolder && selectedFolderId !== 'all' && (
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartRename(selectedFolder)}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteFolder(selectedFolder)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                  <Button onClick={handleNewContactClick} className="bg-orange-500 hover:bg-orange-600 text-white"><Plus className="mr-2 h-4 w-4" /> Add Contact</Button>
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
                                      <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => { setContactToEdit(contact); setIsContactFormOpen(true); }}>{contact.name}</TableCell>
                                      <TableCell>{contact.email}</TableCell>
                                      <TableCell>{primaryPhoneNumber}</TableCell>
                                      {selectedFolderId === 'all' && <TableCell>{folderName}</TableCell>}
                                      <TableCell onClick={(e) => e.stopPropagation()}>
                                          <DropdownMenu>
                                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onSelect={() => { setContactToEdit(contact); setIsContactFormOpen(true); }}><BookOpen className="mr-2 h-4 w-4" />Open</DropdownMenuItem>
                                                  <DropdownMenuItem onSelect={() => { setContactToEdit(contact); setIsContactFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem className="text-destructive" onSelect={async () => { if (window.confirm(`Are you sure you want to delete "${contact.name}"?`)) { await deleteContacts([contact.id]); setContacts(prev => prev.filter(c => c.id !== contact.id)); toast({ title: "Contact Deleted" }); } }}> <Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
      
      <AlertDialog open={folderToDelete !== null || foldersToDelete !== null} onOpenChange={() => { setFolderToDelete(null); setFoldersToDelete(null); }}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    {foldersToDelete ? `This will permanently delete ${foldersToDelete.length} folder(s), including all their subfolders and contacts.` : `This will permanently delete the "${folderToDelete?.name}" folder, including all its subfolders and contacts.`} This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
