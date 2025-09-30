
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDrag, useDrop } from 'react-dnd';
import {
  Folder,
  Pencil,
  LoaderCircle,
  ArrowLeft,
  Users,
  File as FileIconLucide,
  ChevronRight,
  FolderPlus,
  MoreVertical,
  Link as LinkIcon,
  Search,
  FilePlus,
  ClipboardCopy,
  Info,
  ArrowUpDown,
  ExternalLink,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { type FileItem, type FolderItem } from '@/data/files';
import { useToast } from '@/hooks/use-toast';
import { 
    getFolders, 
    addFolder, 
    updateFolder,
    getFiles,
    addTextFile,
    updateFile,
    removeFoldersAndContents,
    deleteFiles as deleteFilesService,
} from '@/services/file-service';
import { moveFile } from '@/app/actions/file-actions';
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
import { Checkbox } from '../ui/checkbox';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const ItemTypes = {
    FILE: 'file',
    FOLDER: 'folder',
};

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof FileItem; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const [isAddLinkDialogOpen, setIsAddLinkDialogOpen] = useState(false);
  const [fileToLink, setFileToLink] = useState<FileItem | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  
  const [itemsToRemove, setItemsToRemove] = useState<{ folders: FolderItem[], files: FileItem[] }>({ folders: [], files: [] });
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);


  const { toast } = useToast();
  const { user } = useAuth();
  
  const loadInitialData = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const [fetchedFolders, fetchedFiles] = await Promise.all([
            getFolders(user.uid),
            getFiles(user.uid)
        ]);
        setFolders(fetchedFolders.sort((a,b) => a.name.localeCompare(b.name)));
        setAllFiles(fetchedFiles);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Failed to load data",
            description: error.message || "Could not retrieve data from the database.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    setSelectedFileIds([]);
  }, [selectedFolderId]);

  const selectedFolder = useMemo(
    () => folders.find((f) => f && f.id === selectedFolderId),
    [folders, selectedFolderId]
  );
  
  const displayedFiles = useMemo(() => {
    if (selectedFolderId === 'all') {
        return allFiles;
    }
    return allFiles.filter(file => file.folderId === selectedFolderId);
  }, [selectedFolderId, allFiles]);
  
  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    try {
        const newFolder = await addFolder({ name: newFolderName, userId: user.uid, parentId: newFolderParentId, createdAt: new Date() });
        setFolders(prev => [...prev, newFolder].sort((a,b) => a.name.localeCompare(b.name)));
        if (newFolder.parentId) {
            setExpandedFolders(prev => new Set(prev).add(newFolder.parentId!));
        }
        toast({ title: "Folder Created" });
    } catch(e: any) { 
        toast({ variant: "destructive", title: "Failed", description: (e as Error).message }); 
    } finally { 
        setIsNewFolderDialogOpen(false); 
        setNewFolderName(""); 
    }
  };
  
  const handleToggleSelectAll = () => {
    if (selectedFileIds.length === sortedFiles.length) {
        setSelectedFileIds([]);
    } else {
        setSelectedFileIds(sortedFiles.map(f => f.id));
    }
  };

  const handleSort = (key: keyof FileItem) => {
    setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const handleDrop = async (item: { ids?: string[], type: string }, folderId: string | null) => {
    if (!folderId || !item.ids || item.type !== ItemTypes.FILE) return;
    
    const originalFiles = [...allFiles];
    setAllFiles(prev => prev.map(f => item.ids!.includes(f.id) ? { ...f, folderId } : f));
    setSelectedFileIds([]);

    try {
        await Promise.all(item.ids.map(id => moveFile(id, folderId)));
        toast({ title: `${item.ids.length} file(s) moved successfully.` });
    } catch (error: any) {
        setAllFiles(originalFiles);
        toast({ variant: "destructive", title: "Move Failed", description: error.message });
    }
  };
  
  const handleNewFile = async () => {
    if (selectedFolderId === 'all') {
        toast({ variant: 'destructive', title: 'No Folder Selected', description: 'Please select a folder before creating a new file.' });
        return;
    }
    setIsNewFileDialogOpen(true);
  };
  
  const handleSaveNewFile = async () => {
    if (!user) return;
    if (!newFileName.trim()) {
        toast({ variant: 'destructive', title: 'File Name Required', description: 'Please enter a name for your file.' });
        return;
    }
    
    setIsNewFileDialogOpen(false);
    try {
        const finalFileName = newFileName;
        const newFile = await addTextFile(user.uid, selectedFolderId || '', finalFileName);
        setAllFiles(prev => [...prev, newFile]);
        toast({ title: 'Placeholder Created', description: `"${finalFileName}" is ready to be linked.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create file', description: error.message });
    } finally {
        setNewFileName('');
    }
  };
  
  const handleOpenLinkDialog = (file: FileItem) => {
    setFileToLink(file);
    setLinkUrl(file.driveLink || '');
    setIsAddLinkDialogOpen(true);
  };

  const handleSaveLink = async () => {
    if (!fileToLink) return;
    try {
        await updateFile(fileToLink.id, { driveLink: linkUrl });
        setAllFiles(prev => prev.map(f => f.id === fileToLink.id ? { ...f, driveLink: linkUrl } : f));
        toast({ title: "Link Saved", description: "The URL has been linked to the file." });
        setIsAddLinkDialogOpen(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to save link", description: error.message });
    }
  };
  
  const handleDriveSearch = (e: React.KeyboardEvent<HTMLInputElement> | string) => {
    const query = typeof e === 'string' ? e : (e.key === 'Enter' && searchQuery.trim()) ? searchQuery : null;
    if (query) {
      const url = `https://drive.google.com/drive/search?q=${encodeURIComponent(query)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenFile = (file: FileItem) => {
    if (file.driveLink) {
        window.open(file.driveLink, '_blank', 'noopener,noreferrer');
    } else {
        handleOpenLinkDialog(file);
    }
  };

  const handleStartRename = (e: React.MouseEvent, folder: FolderItem) => {
    e.stopPropagation();
    setRenamingFile(null); // Ensure we're not renaming a file at the same time
    setRenamingFolder(folder);
    setRenameInputValue(folder.name);
  };

  const handleCancelRename = () => {
    setRenamingFolder(null);
    setRenamingFile(null);
    setRenameInputValue("");
  };

  const handleConfirmFolderRename = async () => {
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
  
  const handleStartFileRename = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    setRenamingFolder(null); // Ensure we're not renaming a folder at the same time
    setRenamingFile(file);
    setRenameInputValue(file.name);
  };

  const handleConfirmFileRename = async () => {
    if (!renamingFile || !renameInputValue.trim() || renamingFile.name === renameInputValue.trim()) {
      handleCancelRename();
      return;
    }

    try {
        await updateFile(renamingFile.id, { name: renameInputValue.trim() });
        setAllFiles(prev => prev.map(f => f.id === renamingFile.id ? { ...f, name: renameInputValue.trim() } : f));
        toast({ title: "File Renamed" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Rename Failed", description: error.message });
    } finally {
        handleCancelRename();
    }
  };
  
  const handleRemoveItems = (files: FileItem[], folders: FolderItem[]) => {
    setItemsToRemove({ files, folders });
    setIsRemoveConfirmOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!user) return;
    
    const { files: filesToRemove, folders: foldersToRemove } = itemsToRemove;
    const folderIdsToRemove = foldersToRemove.map(f => f.id);
    const fileIdsToRemove = filesToRemove.map(f => f.id);

    if (folderIdsToRemove.length === 0 && fileIdsToRemove.length === 0) {
        setIsRemoveConfirmOpen(false);
        return;
    }

    try {
        if (folderIdsToRemove.length > 0) {
            await removeFoldersAndContents(user.uid, folderIdsToRemove);
        }
        if (fileIdsToRemove.length > 0) {
            await deleteFilesService(fileIdsToRemove);
        }

        // Optimistic UI update
        if (folderIdsToRemove.length > 0) {
            // Re-fetch all data as recursive deletion makes local filtering complex
            await loadInitialData();
        } else {
            setAllFiles(prev => prev.filter(f => !fileIdsToRemove.includes(f.id)));
        }

        toast({ title: "Items Removed" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to remove items", description: error.message });
        loadInitialData(); // Revert on failure
    } finally {
        setItemsToRemove({ files: [], folders: [] });
        setIsRemoveConfirmOpen(false);
        setSelectedFileIds([]);
    }
  };
  
  const DraggableFileRow = ({ file }: { file: FileItem }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.FILE,
        item: () => {
            const isSelectedInDrag = selectedFileIds.includes(file.id);
            const draggedIds = isSelectedInDrag ? selectedFileIds : [file.id];
            return { ids: draggedIds, type: ItemTypes.FILE };
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const isSelected = selectedFileIds.includes(file.id);
    const isRenaming = renamingFile?.id === file.id;

    const handleCopyName = (name: string) => {
        navigator.clipboard.writeText(name).then(() => {
            toast({ title: 'Copied to clipboard', description: `File name "${name}" copied.` });
        }, (err) => {
            toast({ variant: 'destructive', title: 'Copy failed', description: 'Could not copy name to clipboard.' });
        });
    };

    return (
      <div
        ref={drag}
        className={cn(
          "grid items-center grid-cols-[auto_1fr_minmax(0,max-content)_auto] gap-2 h-8 rounded-md border border-foreground bg-blue-100 text-blue-900 cursor-move hover:bg-blue-200",
          isSelected && "bg-blue-200 text-blue-900",
          isDragging && "opacity-50"
        )}
      >
        <div className="h-full flex items-center justify-center pl-2" onClick={(e) => e.stopPropagation()}><Checkbox checked={isSelected} onCheckedChange={() => setSelectedFileIds(p => p.includes(file.id) ? p.filter(id => id !== file.id) : [...p, file.id])} /></div>
        <div className="font-medium text-xs truncate flex items-center gap-2" onClick={isRenaming ? undefined : () => handleOpenFile(file)}>
            {isRenaming ? (
              <Input
                autoFocus
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                onBlur={handleConfirmFileRename}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmFileRename();
                    if (e.key === 'Escape') handleCancelRename();
                }}
                className="h-6 text-xs"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {file.name}
                {file.driveLink && <LinkIcon className="h-3 w-3 text-blue-700 shrink-0" />}
              </>
            )}
        </div>
        <div className="text-xs truncate min-w-max px-2" onClick={isRenaming ? undefined : () => handleOpenFile(file)}>{format(file.modifiedAt, 'PPp')}</div>
        <div className="h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleOpenFile(file)}><ExternalLink className="mr-2 h-4 w-4" /> Open Link</DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => handleStartFileRename(e, file)}><Pencil className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleCopyName(file.name)}><ClipboardCopy className="mr-2 h-4 w-4" /> Copy Name</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleDriveSearch(file.name)}><Search className="mr-2 h-4 w-4" /> Search GDrive</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleOpenLinkDialog(file)}><LinkIcon className="mr-2 h-4 w-4" /> Add/Edit Link</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={() => handleRemoveItems([file], [])}>
                <Trash2 className="mr-2 h-4 w-4" />Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };
  
  const FolderTreeItem = ({ folder, allFolders, level = 0 }: { folder: FolderItem, allFolders: FolderItem[], level?: number }) => {
    const hasChildren = allFolders.some(f => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isRenaming = renamingFolder?.id === folder.id;

    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: [ItemTypes.FILE, ItemTypes.FOLDER],
        drop: (item) => handleDrop(item as any, folder.id),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));

    return (
        <div className="space-y-1" style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
            <div
                ref={drop}
                className={cn(
                    "flex items-center gap-1 pr-1 border border-foreground rounded-md h-8 group",
                    isSelected && "bg-blue-100 text-blue-900",
                    !isSelected && (folder.parentId ? "bg-neutral-200 text-foreground" : "bg-gradient-to-r from-[#C3FFF9] to-[#62C1B6] text-black"),
                    isOver && canDrop && "ring-2 ring-primary bg-primary/20"
                )}
            >
                <div
                  className="flex items-center flex-1 cursor-pointer h-full min-w-0"
                  onClick={() => { if (!isRenaming) setSelectedFolderId(folder.id); }}
                >
                  <ChevronRight 
                    className={cn('h-4 w-4 shrink-0 transition-transform ml-1', isExpanded && 'rotate-90', !hasChildren && 'invisible')} 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setExpandedFolders(p => { const n = new Set(p); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; }); 
                    }} 
                  />
                   {isRenaming ? (
                        <Input
                            autoFocus
                            value={renameInputValue}
                            onChange={(e) => setRenameInputValue(e.target.value)}
                            onBlur={handleConfirmFolderRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmFolderRename();
                                if (e.key === 'Escape') handleCancelRename();
                            }}
                            className="h-6 text-xs ml-2"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="truncate text-xs ml-2 min-w-0">{folder.name}</span>
                    )}
                </div>
                {!isRenaming && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onSelect={() => { setNewFolderParentId(folder.id); setIsNewFolderDialogOpen(true); }}><FolderPlus className="mr-2 h-4 w-4" />New Subfolder</DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => handleStartRename(e, folder)}><Pencil className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => console.log('Checking status for', folder.name)}><Info className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => handleRemoveItems([], [folder])}>
                                <Trash2 className="mr-2 h-4 w-4" />Remove
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
              </div>
              {isExpanded && allFolders.filter(f => f.parentId === folder.id).sort((a,b) => a.name.localeCompare(b.name)).map(child => (
                <FolderTreeItem key={child.id} folder={child} allFolders={allFolders} level={level + 1} />
            ))}
        </div>
    );
  };
  
  const sortedFiles = useMemo(() => {
    return [...displayedFiles].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
            comparison = aVal.getTime() - bVal.getTime();
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [displayedFiles, sortConfig]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <header className="text-center py-4 sm:py-6 px-4 sm:px-6 relative">
            <h1 className="text-3xl font-bold font-headline text-primary">Ogeemo File Cabinet</h1>
            <p className="text-muted-foreground">Your connection to your Google Drive where you organize and manage current files.</p>
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsInfoDialogOpen(true)}>
                    <Info className="h-5 w-5" />
                </Button>
            </div>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="flex h-full flex-col">
                 <div className="flex items-center justify-between p-2 border-b h-14 bg-sidebar text-sidebar-foreground">
                    <h3 className="text-lg font-semibold px-2">Folders</h3>
                    <Button variant="ghost" size="icon" onClick={() => { setNewFolderParentId(null); setIsNewFolderDialogOpen(true); }} title="New Root Folder">
                        <FolderPlus className="h-5 w-5" />
                        <span className="sr-only">New Root Folder</span>
                    </Button>
                </div>
                <ScrollArea className="flex-1 p-2 space-y-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
                    ) : (
                        <>
                            <Button
                                onClick={() => setSelectedFolderId('all')}
                                className={cn(
                                    "w-full justify-center gap-3 my-1 h-8 cursor-pointer rounded-md p-2 border border-foreground",
                                    selectedFolderId === 'all'
                                        ? "bg-blue-100 text-blue-900"
                                        : "bg-gradient-to-r from-[#C3FFF9] to-[#62C1B6] text-black"
                                )}
                            >
                                <Users className="h-4 w-4" /> <span className="text-sm">All Files</span>
                            </Button>
                            {folders.filter(f => !f.parentId).map(folder => (
                                <FolderTreeItem key={folder.id} folder={folder} allFolders={folders} />
                            ))}
                        </>
                    )}
                </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75}>
              <div className="flex flex-col h-full">
                <div className="p-2 border-b flex flex-col gap-2">
                    <div className="flex items-center justify-between h-14">
                        {selectedFileIds.length > 0 ? (
                            <>
                                <h2 className="text-lg font-semibold">{selectedFileIds.length} file(s) selected</h2>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveItems(allFiles.filter(f => selectedFileIds.includes(f.id)), [])}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 min-w-0">
                                    <h2 className="text-lg font-semibold truncate">{selectedFolder?.name || 'All Files'}</h2>
                                    <span className="text-sm text-muted-foreground">({displayedFiles.length} file(s))</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button asChild size="sm">
                                        <a href="https://drive.google.com/drive/my-drive" target="_blank" rel="noopener noreferrer">
                                            <Folder className="mr-2 h-4 w-4" /> GDrive
                                        </a>
                                    </Button>
                                    <Button asChild size="sm">
                                        <a href="https://drive.google.com/drive/folders/1RdaPZL3uPXlmXort_nydmcfFvaeQtJ1e" target="_blank" rel="noopener noreferrer">
                                            <Folder className="mr-2 h-4 w-4" /> My Favorites
                                        </a>
                                    </Button>
                                    <Button size="sm" onClick={handleNewFile}><FilePlus className="mr-2 h-4 w-4" /> Create File Name</Button>
                                </div>
                            </>
                        )}
                    </div>
                     <div className="relative border border-black rounded-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search Google Drive..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => handleDriveSearch(e as React.KeyboardEvent<HTMLInputElement>)}
                            className="pl-8"
                        />
                    </div>
                </div>
                  <ScrollArea className="flex-1 overflow-y-auto p-2">
                       <div className="grid items-center grid-cols-[auto_1fr_minmax(0,max-content)_auto] gap-2 h-8 p-2">
                          <div className="h-full w-8 flex items-center justify-center pl-2">
                            <Checkbox onCheckedChange={handleToggleSelectAll} checked={sortedFiles.length > 0 && selectedFileIds.length === sortedFiles.length} />
                          </div>
                          <Button variant="ghost" onClick={() => handleSort('name')} className="justify-start p-0 h-auto font-medium text-muted-foreground hover:bg-transparent text-xs">Name <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                          <Button variant="ghost" onClick={() => handleSort('modifiedAt')} className="justify-start p-0 h-auto font-medium text-muted-foreground hover:bg-transparent text-xs">Last Modified <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                          <div className="w-8 flex items-center justify-center"><span className="sr-only">Actions</span></div>
                      </div>
                      <div className="space-y-1">
                          {sortedFiles.length > 0 ? (
                              sortedFiles.map(file => (
                                <DraggableFileRow key={file.id} file={file} />
                              ))
                          ) : (
                               <div className="flex items-center justify-center h-48 text-muted-foreground">This folder is empty.</div>
                          )}
                      </div>
                  </ScrollArea>
              </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Create New File Placeholder</DialogTitle>
                  <DialogDescription>
                      Enter a name for your new file. It will be saved in the "{selectedFolder?.name}" folder.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="new-file-name">File Name</Label>
                  <Input 
                      id="new-file-name" 
                      value={newFileName} 
                      onChange={(e) => setNewFileName(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveNewFile() }}
                      placeholder="e.g., My meeting notes"
                  />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsNewFileDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => handleSaveNewFile()}>Create</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label htmlFor="new-folder-name">Name</Label>
              <Input id="new-folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder() }} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => handleCreateFolder()}>Create</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isAddLinkDialogOpen} onOpenChange={setIsAddLinkDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add/Edit Link</DialogTitle>
                <DialogDescription>
                    Add an external URL (like a Google Drive link) to "{fileToLink?.name}".
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="link-url">URL</Label>
                <Input 
                    id="link-url" 
                    value={linkUrl} 
                    onChange={(e) => setLinkUrl(e.target.value)} 
                    placeholder="https://docs.google.com/..."
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddLinkDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => handleSaveLink()}>Save Link</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>About the Ogeemo File Cabinet</DialogTitle>
                <DialogDescription>
                   Your central hub for organizing digital assets by linking them to your Google Drive.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Core Concept: A Bridge to Your Drive</AccordionTrigger>
                  <AccordionContent>
                    The Ogeemo File Cabinet doesn't store your files directly. Instead, it acts as a powerful organizational layer on top of your Google Drive, allowing you to manage links to your documents, sheets, and slides within the context of your Ogeemo workspace.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-2">
                    <AccordionTrigger>Recommended Setup: The "Favorites" Folder</AccordionTrigger>
                    <AccordionContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p>For the best experience, we recommend creating a dedicated folder in your Google Drive to hold all your Ogeemo-related files. This keeps everything organized.</p>
                            <ol>
                                <li>Click the <strong>"GDrive"</strong> button to open your Google Drive in a new tab.</li>
                                <li>Right-click on “My Drive” and select <strong>"New folder"</strong>.</li>
                                <li>Name the folder: <strong>“0 My Favorites.”</strong> Using a "Zero" at the beginning ensures this folder always appears at the top of your “My Drive” folder list for easy access.</li>
                                <li>In your Ogeemo File Cabinet, to create a link to this new folder, click the button called <strong>“Create File Name.”</strong></li>
                                <li>In Google Drive, select your new “My Favorites” folder, right-click the folder, then click <strong>Share</strong> and select <strong>“Copy Link”</strong>.</li>
                                <li>Then go back to your Filing Cabinet and click on the file name you created called “My Favorites". Then in the 3-dot menu click <strong>“Add/Edit Link”</strong>.</li>
                                <li>Paste the link you copied into the provided field.</li>
                                <li>When you create new documents (Docs, Sheets, etc.) for Ogeemo, go to your new “My Favorites” folder and click <strong>“New”</strong>. Then click the <strong>“+ New”</strong> button to see the drop-down list of apps that you can select from.</li>
                                <li>When you create a new app, e.g., a document or sheet, it will automatically save to your favorites folder. This will save you a lot of time in dealing with your files.</li>
                            </ol>
                            <p><strong>Note:</strong> You can also create sub-folders for your “My Favorites” folder. Just right-click and select “New Folder.” If you are using sub-folders, just make sure you select the subfolder you want before creating a new document.</p>
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How to Add Files</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li><strong>Create a Placeholder:</strong> Click the "Create File Name" button to create a placeholder entry in the selected folder. This acts as a bookmark for your external file.</li>
                      <li><strong>Get Your Google Drive Link:</strong> Find your file in Google Drive, click "Share", and copy the link.</li>
                      <li><strong>Link It:</strong> In Ogeemo, click the 3-dot menu on your placeholder and select "Add/Edit Link". Paste the Google Drive URL here. The file icon will now indicate it's a linked file.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>Searching Your Drive</AccordionTrigger>
                    <AccordionContent className="text-sm">
                    You can search your entire Google Drive directly from the File Cabinet. Type your query into the search bar and press Enter. A new tab will open with your search results in Google Drive. You can also search for a specific file by using the 3-dot menu on a file and selecting "Search GDrive".
                    </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsInfoDialogOpen(false)}>Got it</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

       <AlertDialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {itemsToRemove.folders.length > 0 && `${itemsToRemove.folders.length} folder(s)`} {itemsToRemove.folders.length > 0 && itemsToRemove.files.length > 0 && 'and'} {itemsToRemove.files.length > 0 && `${itemsToRemove.files.length} file(s)`}, including all sub-folders and their contents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
