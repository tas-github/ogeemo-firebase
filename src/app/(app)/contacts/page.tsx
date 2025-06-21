
"use client";

import React, { useState, useMemo } from 'react';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  File,
} from 'lucide-react';

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
import {
  type Contact,
  type FolderData,
  mockContacts,
  mockFolders,
} from '@/data/contacts';


export default function ContactsPage() {
  const [folders, setFolders] = useState<FolderData[]>(mockFolders);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(mockFolders[0]?.id || null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  const displayedContacts = useMemo(
    () => contacts.filter((c) => c.folderId === selectedFolderId),
    [contacts, selectedFolderId]
  );

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

  const allVisibleSelected = displayedContacts.length > 0 && selectedContactIds.length === displayedContacts.length;
  const someVisibleSelected = selectedContactIds.length > 0 && selectedContactIds.length < displayedContacts.length;
  
  const handleDeleteSelected = () => {
    setContacts(contacts.filter(c => !selectedContactIds.includes(c.id)));
    setSelectedContactIds([]);
  }

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
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
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
                                        <Button>
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
                                            <TableHead className="w-[60px]"></TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayedContacts.map((contact) => (
                                            <TableRow key={contact.id} data-state={selectedContactIds.includes(contact.id) && "selected"}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedContactIds.includes(contact.id)}
                                                        onCheckedChange={() => handleToggleSelect(contact.id)}
                                                        aria-label={`Select ${contact.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                     <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                        <File className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{contact.name}</TableCell>
                                                <TableCell>{contact.email}</TableCell>
                                                <TableCell>{contact.phone}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
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
                            <p className="text-muted-foreground">Select a folder to view contacts.</p>
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
