
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
  Link as LinkIcon,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type FileItem, type FolderItem } from '@/data/files';
import { useToast } from '@/hooks/use-toast';
import { getFolders, getFiles, addFolder, deleteFiles, updateFolder, deleteFoldersAndContents, addTextFileClient, addFileRecord, findOrCreateFileFolder, updateFile, addFile } from '@/services/file-service';
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
import { Checkbox } from '../ui/checkbox';

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
  
  const [isDriveLinkDialogOpen, setIsDriveLinkDialogOpen] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [driveFileName, setDriveFileName] = useState('');
  const [fileToLink, setFileToLink] = useState<FileItem | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);


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
    setSelectedFileIds([]); // Clear selection when changing folders
  };

  const handleSelectFile = (file: FileItem) => {
    if (file.type === 'google-drive-link' && file.driveLink) {
        window.open(file.driveLink, '_blank', 'noopener,noreferrer');
    } else if (file.type.startsWith('text/')) {
        router.push(`/text-editor?fileId=${file.id}`);
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
            createdAt: new Date(),
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
  
  const handleOpenDriveLinkDialog = (file: FileItem) => {
    setFileToLink(file);
    setDriveLink(file.driveLink || '');
    setIsDriveLinkDialogOpen(true);
  };

  const handleAddDriveLink = async () => {
    if (!fileToLink || !driveLink.trim()) {
        toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please enter a valid Google Drive URL.' });
        return;
    }
    try {
        await updateFile(fileToLink.id, {
            driveLink: driveLink.trim(),
            type: 'google-drive-link', // Change type on linking
        });
        setFiles(prev => prev.map(f => f.id === fileToLink.id ? { ...f, driveLink: driveLink.trim(), type: 'google-drive-link' } : f));
        toast({ title: 'Google Drive File Linked' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to link file', description: error.message });
    } finally {
        setIsDriveLinkDialogOpen(false);
        setFileToLink(null);
        setDriveLink('');
    }
  };
  
  const handleDeleteFolder = (folder: FolderItem) => {
        setFolderToDelete(folder);
  };

  const handleConfirmDeleteFolder = async () => {
        if (!user || !folderToDelete) return;
        try {
            await deleteFoldersAndContents(user.uid, [folderToDelete.id]);
            const foldersToDelete = new Set<string>([folderToDelete.id]);
            const findDescendants = (parentId: string) => {
                folders.filter(f => f.parentId === parentId).forEach(child => {
                    foldersToDelete.add(child.id);
                    findDescendants(child.id);
                });
            };
            findDescendants(folderToDelete.id);

            setFolders(prev => prev.filter(f => !foldersToDelete.has(f.id)));
            setFiles(prev => prev.filter(f => !foldersToDelete.has(f.id)));
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
    
    const handleUploadClick = () => {
        if (!selectedFolderId || selectedFolderId === 'all') {
            toast({ variant: 'destructive', title: 'No Folder Selected', description: 'Please select a folder to upload a file into.'});
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user || !selectedFolderId || selectedFolderId === 'all') {
            toast({ variant: 'destructive', title: 'Upload Canceled', description: 'You must select a specific folder before uploading a file.' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.uid);
        formData.append('folderId', selectedFolderId);

        try {
            const newFile = await addFile(formData);
            setFiles(prev => [newFile, ...prev]);
            toast({ title: 'File Uploaded', description: `"${newFile.name}" has been uploaded successfully.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        }
    };

  const handleCreateNewFile = async () => {
    if (!user || !newFileName.trim()) {
      toast({ variant: 'destructive', title: 'File name is required.' });
      return;
    }
    if (!selectedFolderId || selectedFolderId === 'all') {
      toast({ variant: 'destructive', title: 'Please select a folder first.' });
      return;
    }
    try {
      const newFile = await addTextFileClient(user.uid, selectedFolderId, newFileName);
      setFiles(prev => [newFile, ...prev]);
      toast({ title: 'File Created' });
      setIsNewFileDialogOpen(false);
      setNewFileName('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to create file', description: error.message });
    }
  };

  const handleToggleSelect = (fileId: string) => {
    setSelectedFileIds(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
  };
  
  const handleToggleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedFileIds(checked ? filesInSelectedFolder.map(f => f.id) : []);
  };
  
  const handleConfirmBulkDelete = async () => {
    if (selectedFileIds.length === 0) return;
    try {
        await deleteFiles(selectedFileIds);
        setFiles(prev => prev.filter(f => !selectedFileIds.includes(f.id)));
        toast({ title: `${selectedFileIds.length} file(s) deleted.`});
        setSelectedFileIds([]);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Bulk Delete Failed", description: error.message });
    } finally {
        setIsBulkDeleteAlertOpen(false);
    }
  };

  const allVisibleSelected = filesInSelectedFolder.length > 0 && selectedFileIds.length === filesInSelectedFolder.length;
  const someVisibleSelected = selectedFileIds.length > 0 && !allVisibleSelected;


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
    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md" />
    <div className="p-4 sm:p-6 space-y-4">
        <header className="text-center">
            <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-bold font-headline text-primary">File Manager</h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild variant="ghost" size="icon">
                        <Link href="/files/manage">
                           <Info className="h-5 w-5 text-muted-foreground" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Instructions</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
            <p className="text-muted-foreground">Your unified space for notes, documents, and files.</p>
        </header>

        <Card>
            <CardHeader className="p-2">
                <div className="grid grid-cols-3 gap-2">
                    <Button className="flex-1" onClick={() => handleOpenNewFolderDialog(null)}>
                        <FolderPlus className="mr-2 h-4 w-4"/> New Folder
                    </Button>
                    <Button className="flex-1" onClick={() => setIsNewFileDialogOpen(true)}>
                        <FilePlus2 className="mr-2 h-4 w-4"/> New File
                    </Button>
                    <Button className="flex-1" onClick={handleUploadClick}>
                        <Upload className="mr-2 h-4 w-4"/> Upload File
                    </Button>
                </div>
            </CardHeader>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Column 1: Folders */}
        <div className="md:col-span-1 flex flex-col gap-2">
            <div className="h-8 flex items-center p-1 border border-black bg-primary/10 rounded-md text-primary">
                <p className="flex-1 text-center font-semibold text-sm">Folders</p>
            </div>
            <div className="flex flex-col border border-black rounded-lg h-[calc(100vh-350px)]">
              <div
                className={cn("p-2 border-b", selectedFolderId === 'all' && 'bg-primary/20')}
                onClick={() => handleSelectFolder('all')}
              >
                  <Button variant="ghost" className="w-full justify-start gap-2 h-7"><Files className="h-4 w-4" />All Files</Button>
              </div>
              <ScrollArea className="flex-1 rounded-md p-2">
                  {folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)).map(folder => (
                    <FolderTreeItem key={folder.id} folder={folder} allFolders={folders} />
                  ))}
              </ScrollArea>
            </div>
        </div>

        {/* Column 2 & 3: Files */}
        <div className="md:col-span-2 flex flex-col gap-2">
            <div className="h-8 flex items-center p-1 border border-black bg-primary/10 rounded-md text-primary">
                {selectedFileIds.length > 0 ? (
                     <div className="flex justify-between items-center w-full px-2">
                        <p className="font-semibold text-sm">{selectedFileIds.length} file(s) selected</p>
                        <Button variant="destructive" size="sm" className="h-6" onClick={() => setIsBulkDeleteAlertOpen(true)}>
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete Selected
                        </Button>
                     </div>
                ) : (
                    <p className="flex-1 text-center font-semibold text-sm">Files in "{selectedFolderId === 'all' ? 'All Folders' : folders.find(f=>f.id===selectedFolderId)?.name}"</p>
                )}
            </div>
            <div className="flex flex-col border border-black rounded-lg h-[calc(100vh-350px)]">
                <div className="p-2 border-b h-8 flex items-center">
                    <Checkbox
                        checked={allVisibleSelected ? true : (someVisibleSelected ? 'indeterminate' : false)}
                        onCheckedChange={(checked) => handleToggleSelectAll(checked)}
                        className="ml-2 mr-4"
                        aria-label="Select all files"
                    />
                    <p className="text-xs font-medium text-muted-foreground">Name</p>
                </div>
                <ScrollArea className="flex-1">
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <LoaderCircle className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      filesInSelectedFolder.length > 0 ? (
                        filesInSelectedFolder.map((file) => {
                          const isRenaming = renamingFile?.id === file.id;
                          return (
                            <div key={file.id} className="flex items-center border-b h-8 group">
                                <Checkbox
                                    checked={selectedFileIds.includes(file.id)}
                                    onCheckedChange={() => handleToggleSelect(file.id)}
                                    className="ml-2 mr-4"
                                    aria-label={`Select file ${file.name}`}
                                />
                              <div className="flex items-center flex-1 min-w-0 h-full" onClick={() => !isRenaming && handleSelectFile(file)}>
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
                                      <BookOpen className="mr-2 h-4 w-4" /> Open / Preview
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onSelect={() => handleStartFileRename(file)}>
                                      <Pencil className="mr-2 h-4 w-4" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleOpenDriveLinkDialog(file)}>
                                      <LinkIcon className="mr-2 h-4 w-4" /> Link Google Drive File
                                    </DropdownMenuItem>
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
                    )}
                  </CardContent>
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

    <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Create New File</DialogTitle>
                <DialogDescription>
                    Enter a name for your new file. It will be created as a blank text file.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="file-name-new">File Name</Label>
              <Input id="file-name-new" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onKeyDown={async (e) => { if (e.key === 'Enter') { await handleCreateNewFile(); } }}/>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFileDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateNewFile}>Create File</Button>
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
    <Dialog open={isDriveLinkDialogOpen} onOpenChange={setIsDriveLinkDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Link to a Google Drive File</DialogTitle>
                <DialogDescription>
                    Paste the shareable URL of a Google Drive file to create a shortcut to it in your File Manager.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label>Ogeemo File</Label>
                    <Input value={fileToLink?.name || ''} readOnly disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="drive-link">Google Drive URL</Label>
                    <Input id="drive-link" value={driveLink} onChange={(e) => setDriveLink(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDriveLinkDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddDriveLink}>Save Link</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete {selectedFileIds.length} file(s). This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
