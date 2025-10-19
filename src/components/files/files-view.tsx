
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Folder,
  File as FileIconLucide,
  LoaderCircle,
  UploadCloud,
  FolderPlus,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
  Users,
  ExternalLink,
  Link as LinkIcon,
  FilePenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type FileItem, type FolderItem } from '@/data/files';
import { useToast } from '@/hooks/use-toast';
import { getFolders, getFiles, addFolder, deleteFiles, updateFolder, updateFile, deleteFolders, addTextFile as addTextFileClient, addFileRecord } from '@/services/file-service';
import { fetchFileContent } from '@/app/actions/file-actions';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import Link from 'next/link';

const NewFileDialog = ({ 
    isOpen, 
    onOpenChange,
    folders,
    selectedFolderId,
    onFileCreated,
}: { 
    isOpen: boolean; 
    onOpenChange: (open: boolean) => void;
    folders: FolderItem[];
    selectedFolderId: string | null;
    onFileCreated: (file: FileItem) => void;
}) => {
    const [fileName, setFileName] = useState('');
    const [newFileFolderId, setNewFileFolderId] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingFolders, setIsLoadingFolders] = useState(false);
    
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setFileName('');
            setNewFolderName('');
            setIsLoading(false);
            if (selectedFolderId && selectedFolderId !== 'all') {
                setNewFileFolderId(selectedFolderId);
            } else if (folders.length > 0) {
                const rootFolder = folders.find(f => !f.parentId)?.id || folders[0].id;
                setNewFileFolderId(rootFolder);
            } else {
                setNewFileFolderId(null);
            }
        }
    }, [isOpen, selectedFolderId, folders]);
    
    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;
        setIsLoadingFolders(true);
        try {
            const newFolder = await addFolder({ name: newFolderName, userId: user.uid, parentId: null });
            onFileCreated({} as FileItem); // This is a bit of a hack to trigger a refresh
            setNewFileFolderId(newFolder.id);
            setNewFolderName('');
            toast({ title: "Folder Created", description: `"${newFolderName}" has been created.`});
        } catch(e: any) {
            toast({ variant: "destructive", title: "Folder Creation Failed", description: e.message });
        } finally {
            setIsLoadingFolders(false);
        }
    };
    
    const handleConfirmCreate = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You are not logged in.' });
            return;
        }
        if (!fileName.trim()) {
            toast({ variant: 'destructive', title: 'File name is required.' });
            return;
        }
        if (!newFileFolderId) {
            toast({ variant: 'destructive', title: 'Please select or create a folder.' });
            return;
        }
        
        setIsLoading(true);
        try {
            const newFile = await addTextFileClient(user.uid, newFileFolderId, fileName, '');
            onFileCreated(newFile);
            toast({ title: 'File Created', description: `"${newFile.name}" has been created.`});
            onOpenChange(false);
            router.push(`/doc-editor?fileId=${newFile.id}`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to create file', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>New Text Document</DialogTitle>
                    <DialogDescription>Enter a name and select a location for your new document.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file-name-save">File Name</Label>
                        <Input id="file-name-save" value={fileName} onChange={(e) => setFileName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Folder</Label>
                        <ScrollArea className="h-48 w-full rounded-md border">
                            <div className="p-2">
                                {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin"/> : folders.map(f => (
                                    <div key={f.id} onClick={() => setNewFileFolderId(f.id)} className={cn("p-2 rounded-md cursor-pointer", newFileFolderId === f.id ? "bg-accent" : "hover:bg-accent/50")}>
                                        {f.name}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                         <div className="flex items-center gap-2 pt-2">
                            <Input
                                placeholder="Or create a new root folder..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                disabled={isLoadingFolders}
                            />
                            <Button variant="outline" size="sm" onClick={handleCreateFolder} disabled={isLoadingFolders || !newFolderName.trim()}>
                                {isLoadingFolders ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Create'}
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirmCreate} disabled={isLoading}>
                        {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Create & Open
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");

  const [isDriveLinkDialogOpen, setIsDriveLinkDialogOpen] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [driveFileName, setDriveFileName] = useState('');

  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);

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
    setSelectedFileId(null);
    setPreviewContent(null);
  };

  const handleSelectFile = async (file: FileItem) => {
    if (renamingFile?.id === file.id) return;

    if (file.type === 'google-drive-link' && file.driveLink) {
        window.open(file.driveLink, '_blank', 'noopener,noreferrer');
        return;
    }

    if (file.type.startsWith('text/')) {
        router.push(`/doc-editor?fileId=${file.id}`);
        return;
    }
    
    setSelectedFileId(file.id);
    setIsPreviewLoading(true);
    setPreviewContent(null);
    try {
      if (file.storagePath) {
        const { content, error } = await fetchFileContent(file.storagePath);
        if (error) throw new Error(error);
        setPreviewContent(content || 'No text content to display for this file type.');
      } else {
        setPreviewContent('This file does not have any content to preview.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load preview',
        description: error.message,
      });
      setPreviewContent('Error loading preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };
  
  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const filesInSelectedFolder = React.useMemo(() => {
    if (selectedFolderId === 'all') return files;
    return files.filter((file) => file.folderId === selectedFolderId);
  }, [files, selectedFolderId]);

  const selectedFile = React.useMemo(() => {
      if (!selectedFileId) return null;
      return files.find(f => f.id === selectedFileId);
  }, [files, selectedFileId]);

  const handleOpenNewFolderDialog = (parentId: string | null) => {
    setNewFolderParentId(parentId);
    setNewFolderName('');
    setIsNewFolderDialogOpen(true);
  };

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    if (!user || !name.trim()) {
        toast({ variant: 'destructive', title: 'Folder name is required.'});
        return null;
    };
    try {
        const newFolder = await addFolder({
            name: name.trim(),
            userId: user.uid,
            parentId: parentId,
            createdAt: new Date(),
        });
        setFolders(prev => [...prev, newFolder]);
        if (newFolder.parentId) {
            setExpandedFolders(prev => new Set(prev).add(newFolder.parentId!));
        }
        toast({ title: 'Folder Created' });
        return newFolder;
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create folder', description: error.message });
        return null;
    }
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      await deleteFiles([fileToDelete.id]);
      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      if (selectedFileId === fileToDelete.id) {
        setSelectedFileId(null);
        setPreviewContent(null);
      }
      toast({ title: 'File Deleted' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } finally {
      setFileToDelete(null);
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!user || !folderToDelete) return;
    
    try {
        const allFolders = await getFolders(user.uid);
        const folderIdsToDelete = new Set<string>([folderToDelete.id]);
        
        const findDescendants = (parentId: string) => {
            allFolders
                .filter(f => f.parentId === parentId)
                .forEach(child => {
                    folderIdsToDelete.add(child.id);
                    findDescendants(child.id);
                });
        };
        
        folderIdsToDelete.forEach(id => findDescendants(id));

        await deleteFolders(user.uid, Array.from(folderIdsToDelete));

        setFolders(prev => prev.filter(f => !folderIdsToDelete.has(f.id)));
        setFiles(prev => prev.filter(f => f.folderId && !folderIdsToDelete.has(f.folderId)));
        
        toast({ title: 'Folder Deleted', description: `"${folderToDelete.name}" and all its contents have been removed.` });
        
        if (folderIdsToDelete.has(selectedFolderId)) {
            setSelectedFolderId('all');
        }

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
        loadData();
    } finally {
        setFolderToDelete(null);
    }
  };

  const handleStartRename = (item: FolderItem | FileItem, type: 'folder' | 'file') => {
    if (type === 'folder') {
        setRenamingFolder(item as FolderItem);
        setRenamingFile(null);
    } else {
        setRenamingFile(item as FileItem);
        setRenamingFolder(null);
    }
    setRenameInputValue(item.name);
  };

  const handleCancelRename = () => {
    setRenamingFolder(null);
    setRenamingFile(null);
    setRenameInputValue("");
  };

  const handleConfirmRename = async () => {
    if ((!renamingFolder && !renamingFile) || !renameInputValue.trim()) {
        handleCancelRename();
        return;
    }

    try {
        if (renamingFolder) {
            if (renamingFolder.name !== renameInputValue.trim()) {
                await updateFolder(renamingFolder.id, { name: renameInputValue.trim() });
                setFolders(prev => prev.map(f => f.id === renamingFolder.id ? { ...f, name: renameInputValue.trim() } : f));
                toast({ title: "Folder Renamed" });
            }
        } else if (renamingFile) {
             if (renamingFile.name !== renameInputValue.trim()) {
                await updateFile(renamingFile.id, { name: renameInputValue.trim() });
                setFiles(prev => prev.map(f => f.id === renamingFile.id ? { ...f, name: renameInputValue.trim() } : f));
                toast({ title: "File Renamed" });
            }
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Rename Failed", description: error.message });
    } finally {
        handleCancelRename();
    }
  };
  
  const handleAddDriveLink = async () => {
    if (!user || !driveLink.trim() || !driveFileName.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a file name and a valid Google Drive URL.' });
      return;
    }
    if (selectedFolderId === 'all') {
      toast({ variant: 'destructive', title: 'Folder Not Selected', description: 'Please select a folder to save the link in.' });
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
        storagePath: '',
        driveLink: driveLink,
      };
      const newFile = await addFileRecord(newFileRecord);
      setFiles(prev => [...prev, newFile]);
      toast({ title: 'Google Drive Link Added' });
      setIsDriveLinkDialogOpen(false);
      setDriveLink('');
      setDriveFileName('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to add link', description: error.message });
    }
  };

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
                    <Folder className="h-4 w-4 text-primary ml-1" />
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
                        <Button variant="ghost" size="icon" className="h-full w-7">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={() => handleOpenNewFolderDialog(folder.id)}>
                            <FolderPlus className="mr-2 h-4 w-4" /> New Subfolder
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handleStartRename(folder, 'folder')}>
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setFolderToDelete(folder)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
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
    <div className="flex flex-col h-full px-2 py-4 sm:px-3 sm:py-6 space-y-2">
      <header className="text-center relative">
        <h1 className="text-3xl font-bold font-headline text-primary">
          File Manager
        </h1>
        <p className="text-muted-foreground">Browse your files and folders.</p>
      </header>
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg gap-2">
        {/* Column 1: Folders */}
        <ResizablePanel defaultSize={33} minSize={15}>
            <div className="flex h-full flex-col min-h-0 gap-2">
                 <div className="p-2 border border-black relative flex items-center justify-center h-8">
                    <h3 className="font-semibold text-sm px-2 cursor-pointer" onClick={() => handleSelectFolder('all')}>Folders</h3>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleOpenNewFolderDialog(null); }}>
                                        <FolderPlus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>New Root Folder</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                 <Button
                    variant={selectedFolderId === 'all' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-center h-8 border border-black"
                    onClick={() => handleSelectFolder('all')}
                >
                    <Users className="mr-2 h-4 w-4" />
                    All Files
                </Button>
                <Card className="flex-1 flex flex-col border-0 rounded-none min-h-0">
                    <ScrollArea className="flex-1">
                        <CardContent className="p-2">
                            {folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)).map((folder) => (
                               <FolderTreeItem key={folder.id} folder={folder} allFolders={folders} />
                            ))}
                        </CardContent>
                    </ScrollArea>
                </Card>
            </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        {/* Column 2: Files */}
        <ResizablePanel defaultSize={33} minSize={20}>
             <div className="flex h-full flex-col min-h-0 gap-2">
                <div className="p-2 border border-black relative flex items-center justify-center h-8">
                    <h3 className="font-semibold text-sm px-2">Files ({filesInSelectedFolder.length})</h3>
                </div>
                <div className="h-8 border border-black rounded-md flex items-center justify-center px-2">
                   <Button variant="link" className="p-0 h-auto text-sm" onClick={() => setIsDriveLinkDialogOpen(true)}>Add Google Drive Link</Button>
                </div>
                <Card className="flex-1 flex flex-col border-0 rounded-none min-h-0">
                    <ScrollArea className="flex-1">
                        <CardContent className="p-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <LoaderCircle className="h-6 w-6 animate-spin" />
                            </div>
                        ) : selectedFolderId ? (
                            filesInSelectedFolder.length > 0 ? (
                            filesInSelectedFolder.map((file) => {
                                const isRenaming = renamingFile?.id === file.id;
                                const isDriveLink = file.type === 'google-drive-link';
                                return (
                                <div
                                    key={file.id}
                                    className={cn(
                                        "flex items-center border border-black rounded-md cursor-pointer h-8 my-0.5 group",
                                        selectedFileId === file.id && !isRenaming && "bg-primary/20",
                                        isRenaming && "bg-background"
                                    )}
                                    onClick={() => handleSelectFile(file)}
                                >
                                     <div className="flex items-center flex-1 min-w-0 h-full pl-1">
                                        <FileIconLucide className="h-4 w-4 text-muted-foreground ml-1" />
                                        {isRenaming ? (
                                             <Input
                                                autoFocus
                                                value={renameInputValue}
                                                onChange={e => setRenameInputValue(e.target.value)}
                                                onBlur={handleConfirmRename}
                                                onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') handleCancelRename(); }}
                                                className="h-full py-0 px-2 text-xs font-medium"
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="text-xs font-medium truncate ml-2 flex-1">{file.name}</span>
                                        )}
                                        {isDriveLink && <ExternalLink className="h-3 w-3 ml-2 text-blue-500" />}
                                    </div>
                                    <div className="ml-auto">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-full w-7">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem onSelect={() => handleSelectFile(file)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> {isDriveLink ? 'Open Link' : 'Open / Edit'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleStartRename(file, 'file')}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onSelect={() => setFileToDelete(file)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            )})
                            ) : (
                            <div className="text-center text-sm text-muted-foreground p-4">
                                This folder is empty.
                            </div>
                            )
                        ) : (
                            <div className="text-center text-sm text-muted-foreground p-4">
                            Select a folder to see its files.
                            </div>
                        )}
                        </CardContent>
                    </ScrollArea>
                </Card>
            </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        {/* Column 3: Preview & Editor */}
        <ResizablePanel defaultSize={34} minSize={30}>
             <div className="flex h-full flex-col gap-2">
                 <div className="p-2 border border-black flex justify-center items-center h-8">
                    <h3 className="font-semibold text-sm px-2">Preview</h3>
                </div>
                 <div className="h-8 border border-black rounded-md flex items-center justify-center px-2">
                    <Button variant="link" className="p-0 h-auto text-sm" onClick={() => setIsNewFileDialogOpen(true)}>Text Editor</Button>
                </div>
                <Card className="flex-1 flex flex-col border-0 rounded-none">
                    <ScrollArea className="flex-1">
                        <CardContent>
                        {isPreviewLoading ? (
                            <div className="flex items-center justify-center h-full p-6">
                            <LoaderCircle className="h-6 w-6 animate-spin" />
                            </div>
                        ) : selectedFile ? (
                            <div className="space-y-4 py-4">
                                <div className="flex items-center gap-2">
                                    <FileIconLucide className="h-5 w-5" />
                                    <h3 className="font-semibold text-lg">{selectedFile.name}</h3>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <p><strong>Type:</strong> {selectedFile.type}</p>
                                    <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                                    <p><strong>Modified:</strong> {format(selectedFile.modifiedAt, 'PPp')}</p>
                                </div>
                                <pre className="mt-4 p-4 bg-muted rounded-md text-sm whitespace-pre-wrap font-sans overflow-auto">
                                    <code>{previewContent}</code>
                                </pre>
                            </div>
                        ) : (
                            <div className="text-center text-sm text-muted-foreground p-4">
                            Select a file to preview its content.
                            </div>
                        )}
                        </CardContent>
                    </ScrollArea>
                </Card>
            </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
    <NewFileDialog
        isOpen={isNewFileDialogOpen}
        onOpenChange={setIsNewFileDialogOpen}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onFileCreated={(newFile) => {
            if (newFile.id) { // Check if it's a real file object
                setFiles(prev => [...prev, newFile]);
            } else { // It's a hacky refresh signal
                loadData();
            }
        }}
    />
    <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-name-new">Name</Label>
              <Input id="folder-name-new" value={renameInputValue} onChange={(e) => setRenameInputValue(e.target.value)} onKeyDown={async (e) => { if (e.key === 'Enter') { await handleCreateFolder(renameInputValue, newFolderParentId); setIsNewFolderDialogOpen(false); setRenameInputValue(''); } }} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
              <Button onClick={async () => { await handleCreateFolder(renameInputValue, newFolderParentId); setIsNewFolderDialogOpen(false); setRenameInputValue(''); }}>Create</Button>
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
    <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action will permanently delete the file "{fileToDelete?.name}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDeleteFile} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
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
    </>
  );
}
