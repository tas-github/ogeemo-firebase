
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Folder,
  File as FileIconLucide,
  LoaderCircle,
  FolderPlus,
  Plus,
  ChevronRight,
  ExternalLink,
  Upload,
  FilePlus2,
  Files,
  MoreVertical,
  Pencil,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type FileItem, type FolderItem } from '@/data/files';
import { useToast } from '@/hooks/use-toast';
import { getFolders, getFiles, addFolder, deleteFiles, updateFolder, deleteFoldersAndContents, addTextFileClient, addFileRecord, findOrCreateFileFolder, updateFile } from '@/services/file-service';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '../ui/label';
import { Input } from '../ui/input';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import Link from 'next/link';

const OGEEMO_NOTES_FOLDER_NAME = "Ogeemo Notes";

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");

  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [renameFileValue, setRenameFileValue] = useState("");

  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  
  const [isDriveLinkDialogOpen, setIsDriveLinkDialogOpen] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [driveFileName, setDriveFileName] = useState('');
  
  const [isTestCardOpen, setIsTestCardOpen] = useState(false);
  const [testContent, setTestContent] = useState('');
  const [testFileName, setTestFileName] = useState('');


  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const loadData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [fetchedFolders, fetchedFiles] = await Promise.all([
        getFolders(user.uid),
        getFiles(user.uid),
      ]);
      setFolders(fetchedFolders);
      setFiles(fetchedFiles);
      if (fetchedFolders.length > 0) {
        const rootFolder = fetchedFolders.find(f => !f.parentId);
        if (rootFolder) {
            setExpandedFolders(new Set([rootFolder.id]));
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load data',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
  };

  const handleSelectFile = (file: FileItem) => {
    if (file.type === 'google-drive-link' && file.driveLink) {
        window.open(file.driveLink, '_blank', 'noopener,noreferrer');
    } else if (file.type.startsWith('text/')) {
        router.push(`/text-editor?fileId=${file.id}&storagePath=${encodeURIComponent(file.storagePath)}`);
    } else {
        toast({ title: "Preview Unavailable", description: "This file type cannot be opened in the editor."})
    }
  };
  
  const filesInSelectedFolder = React.useMemo(() => {
    if (selectedFolderId === 'all') return files;
    return files.filter((file) => file.folderId === selectedFolderId);
  }, [files, selectedFolderId]);

  const handleOpenNewFolderDialog = (parentId: string | null) => {
    setNewFolderParentId(parentId);
    setNewFolderName('');
    setIsNewFolderDialogOpen(true);
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) {
        toast({ variant: 'destructive', title: 'Folder name is required.'});
        return;
    };
    try {
        const newFolder = await addFolder({
            name: newFolderName.trim(),
            userId: user.uid,
            parentId: newFolderParentId,
        });
        setFolders(prev => [...prev, newFolder]);
        if (newFolder.parentId) {
            setExpandedFolders(prev => new Set(prev).add(newFolder.parentId!));
        }
        setIsNewFolderDialogOpen(false);
        setNewFolderName('');
        toast({ title: 'Folder Created' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create folder', description: error.message });
    }
  };

  const handleStartRename = (item: FolderItem) => {
    setRenamingFolder(item);
    setRenameInputValue(item.name);
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
  
  const handleStartFileRename = (file: FileItem) => {
    setRenamingFile(file);
    setRenameFileValue(file.name);
  };

  const handleCancelFileRename = () => {
    setRenamingFile(null);
    setRenameFileValue("");
  };
  
  const handleConfirmFileRename = async () => {
    if (!renamingFile || !renameFileValue.trim() || renamingFile.name === renameFileValue.trim()) {
        handleCancelFileRename();
        return;
    }
    try {
        await updateFile(renamingFile.id, { name: renameFileValue.trim() });
        setFiles(prev => prev.map(f => f.id === renamingFile.id ? { ...f, name: renameFileValue.trim() } : f));
        toast({ title: "File Renamed" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Rename Failed", description: error.message });
    } finally {
        handleCancelFileRename();
    }
  };


  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
        await deleteFiles([fileToDelete.id]);
        setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
        toast({ title: 'File Deleted' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to delete file', description: error.message });
    } finally {
        setFileToDelete(null);
    }
  };
  
  const handleTestCardSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in.' });
      return;
    }
    if (!selectedFolderId || selectedFolderId === 'all') {
        toast({ variant: 'destructive', title: 'Folder Not Selected', description: 'Please select a folder to save the file into.' });
        return;
    }
    if (!testFileName.trim()) {
        toast({ variant: 'destructive', title: 'File Name Required', description: 'Please enter a name for the file.' });
        return;
    }
    if (!testContent.trim()) {
      toast({ variant: 'destructive', title: 'Content is empty.' });
      return;
    }

    try {
      const newFile = await addTextFileClient(user.uid, selectedFolderId, testFileName, testContent);
      setFiles(prev => [...prev, newFile]);

      toast({ title: 'Test Save Successful', description: `File saved to "${folders.find(f => f.id === selectedFolderId)?.name}".` });
      setTestContent('');
      setTestFileName('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Test Save Failed', description: error.message });
    }
  };

  const handleAddDriveLink = async () => {
    if (!user || selectedFolderId === 'all' || !driveLink.trim() || !driveFileName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a specific folder and provide a name and URL for the link.',
      });
      return;
    }

    try {
      const newFileRecord: Omit<FileItem, 'id'> = {
        name: driveFileName,
        type: 'google-drive-link',
        size: 0,
        modifiedAt: new Date(),
        folderId: selectedFolderId,
        userId: user.uid,
        storagePath: driveLink,
        driveLink: driveLink,
      };
      const savedFile = await addFileRecord(newFileRecord);
      setFiles((prev) => [...prev, savedFile]);
      toast({ title: 'Drive Link Added', description: `Shortcut to "${driveFileName}" has been saved.` });
      setIsDriveLinkDialogOpen(false);
      setDriveFileName('');
      setDriveLink('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to add link', description: error.message });
    }
  };
  
    const handleDeleteFolder = (folder: FolderItem) => {
        setFolderToDelete(folder);
    };

    const handleConfirmDeleteFolder = async () => {
        if (!user || !folderToDelete) return;
        try {
            await deleteFoldersAndContents(user.uid, [folderToDelete.id]);
            const foldersToDelete = new Set([folderToDelete.id]);
            const findDescendants = (parentId: string) => {
                folders.filter(f => f.parentId === parentId).forEach(child => {
                    foldersToDelete.add(child.id);
                    findDescendants(child.id);
                });
            };
            findDescendants(folderToDelete.id);

            setFolders(prev => prev.filter(f => !foldersToDelete.has(f.id)));
            setFiles(prev => prev.filter(f => !foldersToDelete.has(f.folderId)));
            if (selectedFolderId && foldersToDelete.has(selectedFolderId)) {
                setSelectedFolderId('all');
            }
            toast({ title: "Folder Deleted" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Delete Failed", description: error.message });
        } finally {
            setFolderToDelete(null);
        }
    };


  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const FolderTreeItem = ({ folder, allFolders, level = 0 }: { folder: FolderItem, allFolders: FolderItem[], level?: number }) => {
    const hasChildren = allFolders.some(f => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isRenaming = renamingFolder?.id === folder.id;

    return (
        <div style={{ marginLeft: level > 0 ? '1rem' : '0' }} className="my-0.5">
            <div
                className={cn(
                    "flex items-center justify-between border border-black rounded-md cursor-pointer h-8 group",
                    isRenaming ? 'bg-background' : 'hover:bg-accent',
                    selectedFolderId === folder.id && "bg-primary/20",
                )}
                onClick={() => !isRenaming && handleSelectFolder(folder.id)}
            >
                 <div className="flex items-center flex-1 min-w-0 h-full pl-1">
                    {hasChildren ? (
                        <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')} onClick={(e) => { e.stopPropagation(); setExpandedFolders(p => { const n = new Set(p); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; }); }} />
                    ) : <div className="w-4" />}
                    <Folder className="h-4 w-4 text-foreground ml-1" />
                     {isRenaming ? (
                        <Input
                            autoFocus
                            value={renameInputValue}
                            onChange={e => setRenameInputValue(e.target.value)}
                            onBlur={handleConfirmRename}
                            onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') handleCancelRename(); }}
                            className="h-full py-0 px-2 text-sm font-medium bg-transparent"
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-sm font-medium truncate ml-2 flex-1">{folder.name}</span>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={() => handleOpenNewFolderDialog(folder.id)}><FolderPlus className="mr-2 h-4 w-4" />Create subfolder</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleStartRename(folder)}><Pencil className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {isExpanded && allFolders.filter(f => f.parentId === folder.id).sort((a,b) => a.name.localeCompare(b.name)).map(child => (
                <FolderTreeItem key={child.id} folder={child} allFolders={allFolders} level={level + 1} />
            ))}
        </div>
    );
  };


  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <div className="p-4 sm:p-6 space-y-4">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">File Manager</h1>
        <p className="text-muted-foreground">Your unified space for notes, documents, and files.</p>
      </header>
      
      <div className="grid grid-cols-3 gap-2">
        {/* Column 1: Folders */}
        <div className="flex flex-col gap-2">
            <div className="h-8 flex items-center p-1 border border-black bg-primary/10 rounded-md text-primary">
                <div className="w-[32px] shrink-0"></div> {/* Spacer */}
                <p className="flex-1 text-center font-semibold text-sm">Folders</p>
                <Button variant="ghost" size="icon" className="h-6 w-8" onClick={() => handleOpenNewFolderDialog(null)} title="New Root Folder">
                    <FolderPlus className="h-5 w-5" />
                    <span className="sr-only">New Root Folder</span>
                </Button>
            </div>
            <div className="h-8 flex items-center justify-center p-1 border border-black bg-primary/10 rounded-md text-center font-semibold text-sm text-primary">
              <p className="text-center font-semibold text-sm">Select Folder</p>
            </div>
            <div className="flex flex-col border border-black rounded-lg h-[calc(100vh-250px)]">
              <ScrollArea className="flex-1 rounded-md p-2">
                  {folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)).map(folder => (
                    <FolderTreeItem key={folder.id} folder={folder} allFolders={folders} />
                  ))}
              </ScrollArea>
            </div>
        </div>

        {/* Column 2: Files */}
        <div className="flex flex-col gap-2">
            <div className="relative h-8 flex items-center justify-center p-1 border border-black bg-primary/10 rounded-md font-semibold text-sm text-primary">
                <p>Files</p>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSelectFolder('all')} title="Show All Files">
                          <Files className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Show All Files</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => router.push('/text-editor')} title="New Note">
                          <FilePlus2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>New Note</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {}} disabled={!selectedFolderId || selectedFolderId === 'all'}>
                          <Upload className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Upload File</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
            </div>
            <div className="h-8 flex items-center justify-center p-1 border border-black bg-primary/10 rounded-md text-center font-semibold text-sm text-primary">
              <p className="text-center font-semibold text-sm">Select File</p>
            </div>
            <div className="flex flex-col border border-black rounded-lg h-[calc(100vh-250px)]">
                <ScrollArea className="flex-1">
                  <CardContent className="p-2">
                    {isLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <LoaderCircle className="h-6 w-6 animate-spin" />
                      </div>
                    ) : selectedFolderId ? (
                      filesInSelectedFolder.length > 0 ? (
                        filesInSelectedFolder.map((file) => {
                          const isDriveLink = file.type === 'google-drive-link';
                          const isRenaming = renamingFile?.id === file.id;
                          return (
                            <div key={file.id} className="flex items-center border border-black rounded-md cursor-pointer h-8 my-0.5 group">
                              <div className="flex items-center flex-1 min-w-0 h-full pl-1" onClick={() => !isRenaming && handleSelectFile(file)}>
                                <FileIconLucide className="h-4 w-4 text-primary ml-1" />
                                {isRenaming ? (
                                    <Input
                                        autoFocus
                                        value={renameFileValue}
                                        onChange={e => setRenameFileValue(e.target.value)}
                                        onBlur={handleConfirmFileRename}
                                        onKeyDown={e => { if (e.key === 'Enter') handleConfirmFileRename(); if (e.key === 'Escape') handleCancelFileRename(); }}
                                        className="h-full py-0 px-2 text-xs font-medium bg-transparent"
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="text-xs font-medium truncate ml-2 flex-1">{file.name}</span>
                                )}
                                {isDriveLink && <ExternalLink className="h-3 w-3 ml-2 text-blue-500" />}
                              </div>
                              <div className="pr-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => handleSelectFile(file)}>
                                      <BookOpen className="mr-2 h-4 w-4" /> Open / Edit
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onSelect={() => handleStartFileRename(file)}>
                                      <Pencil className="mr-2 h-4 w-4" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setFileToDelete(file); }} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center text-sm text-muted-foreground p-4">This folder is empty.</div>
                      )
                    ) : (
                      <div className="text-center text-sm text-muted-foreground p-4">Select a folder to see its files.</div>
                    )}
                  </CardContent>
                </ScrollArea>
              </div>
        </div>

        {/* Column 3: Editor */}
        <div className="flex flex-col gap-2">
            <div className="h-8 flex items-center justify-center p-1 border border-black bg-primary/10 rounded-md text-center font-semibold text-sm text-primary">
                <Button asChild variant="link" className="p-0 h-auto text-primary">
                    <Link href="/text-editor">
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        New Text File
                    </Link>
                </Button>
            </div>
            <div className="h-8 flex items-center justify-center p-1 border border-black bg-primary/10 rounded-md text-center font-semibold text-sm text-primary">
              <p className="text-center font-semibold text-sm">Preview / Editor</p>
            </div>
            <div className="flex flex-col border border-black rounded-lg h-[calc(100vh-250px)]">
                <ScrollArea className="flex-1">
                    
                </ScrollArea>
            </div>
        </div>
      </div>
    </div>
    
    <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-name-new">Name</Label>
              <Input id="folder-name-new" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={async (e) => { if (e.key === 'Enter') { await handleCreateFolder(); } }} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder}>Create</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
     <Dialog open={isDriveLinkDialogOpen} onOpenChange={setIsDriveLinkDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Add Google Drive Link</DialogTitle>
                <DialogDescription>
                    Paste a link to a Google Drive file to create a shortcut in Ogeemo.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="drive-file-name">Display Name</Label>
                    <Input id="drive-file-name" value={driveFileName} onChange={(e) => setDriveFileName(e.target.value)} placeholder="e.g., Q4 Marketing Report" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="drive-file-url">Google Drive URL</Label>
                    <Input id="drive-file-url" value={driveLink} onChange={(e) => setDriveLink(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
                </div>
                 <p className="text-xs text-muted-foreground">
                    Need to find the link? <a href="https://drive.google.com/drive/my-drive" target="_blank" rel="noopener noreferrer" className="underline text-primary">Go to Google Drive</a>
                </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDriveLinkDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDriveLink}>Add Link</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the folder "{folderToDelete?.name}" and all its contents. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteFolder} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the file "{fileToDelete?.name}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDeleteFile} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
