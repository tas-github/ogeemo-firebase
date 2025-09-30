
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDrag, useDrop } from 'react-dnd';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  LoaderCircle,
  ChevronRight,
  FolderPlus,
  ArrowUpDown,
  Users,
  UploadCloud,
  Edit,
  Link as LinkIcon,
  Search,
  FilePlus,
  ClipboardCopy,
  Wand2,
  Info,
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
    addFile,
    deleteFiles,
    deleteFolders,
    addTextFile,
    getDownloadUrl,
    updateFile,
    addFileRecord,
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
import { FileIcon } from './file-icon';
import { format } from 'date-fns';
import { triggerBrowserDownload } from '@/lib/utils';


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

  const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof FileItem; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const [isAddFileDialogOpen, setIsAddFileDialogOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const [isAddLinkDialogOpen, setIsAddLinkDialogOpen] = useState(false);
  const [fileToLink, setFileToLink] = useState<FileItem | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);


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
  
  const handleDownloadFile = async (file: FileItem) => {
    try {
        const { url, error } = await getDownloadUrl(file.storagePath);
        if (error) throw new Error(error);
        if (url) {
            await triggerBrowserDownload(url, file.name);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Download Failed', description: error.message });
    }
  };

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

  const handleStartRename = (folder: FolderItem) => {
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
  
  const handleConfirmDeleteFolder = async () => {
      if (!user || !folderToDelete) return;
      try {
        await deleteFolders(user.uid, [folderToDelete.id]);
        setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
        setAllFiles(prev => prev.filter(f => f.folderId !== folderToDelete.id));
        toast({ title: "Folder Deleted" });
      } catch(error: any) {
        toast({ variant: "destructive", title: "Delete Failed", description: error.message });
      } finally {
        setFolderToDelete(null);
      }
  };
  
  const handleDeleteFiles = async (filesToDelete: FileItem[]) => {
      if (!user || filesToDelete.length === 0) return;
      
      const fileIdsToDelete = filesToDelete.map(f => f.id);
      
      const originalFiles = [...allFiles];
      setAllFiles(prev => prev.filter(f => !fileIdsToDelete.includes(f.id)));
      setSelectedFileIds([]);

      try {
          await deleteFiles(fileIdsToDelete);
          toast({ title: `${fileIdsToDelete.length} file(s) deleted.` });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
          setAllFiles(originalFiles);
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

  const handleFileUpload = async () => {
    if (!user || filesToUpload.length === 0 || !selectedFolderId || selectedFolderId === 'all') {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Please select one or more files and a specific folder.' });
        return;
    }
    setIsUploading(true);
    let successfulUploads = 0;
    try {
        for (const file of filesToUpload) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.uid);
            formData.append('folderId', selectedFolderId);
            const newFile = await addFile(formData);
            setAllFiles(prev => [...prev, newFile]);
            successfulUploads++;
        }
        toast({ title: 'Upload Successful', description: `${successfulUploads} file(s) have been uploaded.` });
        setIsAddFileDialogOpen(false);
        setFilesToUpload([]);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: `Only ${successfulUploads} files were uploaded. ${error.message}` });
    } finally {
        setIsUploading(false);
    }
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;
    
    let newFolder: FolderItem | null = null;
    setIsUploading(true); // Set loading state at the very beginning
    try {
        const firstFile = files[0];
        const rootFolderName = firstFile.webkitRelativePath.split('/')[0];
        
        if (!rootFolderName) {
            throw new Error("Could not determine folder name from upload.");
        }
        
        toast({ title: 'Folder Upload Started', description: `Uploading folder "${rootFolderName}"...` });

        newFolder = await addFolder({ name: rootFolderName, parentId: selectedFolderId !== 'all' ? selectedFolderId : null, userId: user.uid, createdAt: new Date() });
        setFolders(prev => [...prev, newFolder!]);
        
        const uploadPromises = Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.uid);
            formData.append('folderId', newFolder!.id);
            return addFile(formData);
        });
        
        const newFiles = await Promise.all(uploadPromises);
        setAllFiles(prev => [...prev, ...newFiles]);

        toast({ title: 'Folder Upload Complete', description: `${files.length} file(s) uploaded to "${rootFolderName}".` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Folder Upload Failed', description: error.message });
        // Rollback folder creation on failure
        if (newFolder) {
            try {
                await deleteFolders(user.uid, [newFolder.id]);
                setFolders(prev => prev.filter(f => f.id !== newFolder!.id));
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }
    } finally {
        setIsUploading(false); // Ensure this is always called
        if (folderInputRef.current) {
            folderInputRef.current.value = "";
        }
    }
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
  
  const handleNewFile = () => {
    if (!selectedFolderId || selectedFolderId === 'all') {
        toast({ variant: 'destructive', title: 'No Folder Selected', description: 'Please select a folder before creating a new file.' });
        return;
    }
    setIsNewFileDialogOpen(true);
  };
  
  const handleSaveNewFile = async () => {
    if (!user || !selectedFolderId || selectedFolderId === 'all') return;
    if (!newFileName.trim()) {
        toast({ variant: 'destructive', title: 'File Name Required', description: 'Please enter a name for your file.' });
        return;
    }
    
    setIsUploading(true);
    setIsNewFileDialogOpen(false);
    try {
        const finalFileName = newFileName;
        const newFile = await addTextFile(user.uid, selectedFolderId, finalFileName);
        setAllFiles(prev => [...prev, newFile]);
        toast({ title: 'Placeholder Created', description: `"${finalFileName}" is ready to be linked.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create file', description: error.message });
    } finally {
        setIsUploading(false);
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
  
  const FolderTreeItem = ({ folder, allFolders, level = 0 }: { folder: FolderItem, allFolders: FolderItem[], level?: number }) => {
    const hasChildren = allFolders.some(f => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isRenaming = renamingFolder?.id === folder.id;
    const isSelected = selectedFolderId === folder.id;
    
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.FILE,
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
                    isSelected && !isRenaming && "bg-blue-100 text-blue-900",
                    !isSelected && !isRenaming && (folder.parentId ? "bg-neutral-200 text-foreground" : "bg-gradient-to-r from-[#C3FFF9] to-[#62C1B6] text-black"),
                    isRenaming && "bg-background text-foreground",
                    isOver && canDrop && "ring-2 ring-primary bg-primary/20"
                )}
            >
                <div
                  className="flex items-center flex-1 cursor-pointer h-full min-w-0"
                  onClick={() => { if (!isRenaming) setSelectedFolderId(folder.id) }}
                >
                  <ChevronRight 
                    className={cn('h-4 w-4 shrink-0 transition-transform ml-1', isExpanded && 'rotate-90', !hasChildren && 'invisible')} 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setExpandedFolders(p => { const n = new Set(p); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; }); 
                    }} 
                  />
                  <Folder className={cn('h-4 w-4 shrink-0', 'text-blue-500')} />
                  {isRenaming ? (
                    <Input autoFocus value={renameInputValue} onChange={e => setRenameInputValue(e.target.value)} onBlur={handleConfirmRename} onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') handleCancelRename(); }} className="h-7 ml-2" onClick={e => e.stopPropagation()} />
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
                      <DropdownMenuItem onSelect={() => handleStartRename(folder)}><Pencil className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onSelect={() => setFolderToDelete(folder)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
          "grid items-center grid-cols-[auto_auto_1fr_minmax(0,max-content)_auto] gap-2 h-8 rounded-md border border-foreground bg-blue-100 text-blue-900 cursor-move hover:bg-blue-200",
          isSelected && "bg-blue-200 text-blue-900",
          isDragging && "opacity-50"
        )}
        onClick={() => handleOpenFile(file)}
      >
        <div className="h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}><Checkbox checked={isSelected} onCheckedChange={() => setSelectedFileIds(p => p.includes(file.id) ? p.filter(id => id !== file.id) : [...p, file.id])} /></div>
        <div className="h-full flex items-center justify-center"><FileIcon fileType={file.type} /></div>
        <div className="font-medium text-xs truncate flex items-center gap-2">
            {file.name}
            {file.driveLink && <LinkIcon className="h-3 w-3 text-blue-700 shrink-0" />}
        </div>
        <div className="text-xs truncate min-w-max px-2">{format(file.modifiedAt, 'PPp')}</div>
        <div className="h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleCopyName(file.name)}><ClipboardCopy className="mr-2 h-4 w-4" /> Copy Name</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleDriveSearch(file.name)}><Search className="mr-2 h-4 w-4" /> Search GDrive</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleOpenLinkDialog(file)}><LinkIcon className="mr-2 h-4 w-4" /> Add/Edit Link</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteFiles([file])}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                <Button asChild size="sm">
                  <a href="https://drive.google.com/drive/folders/1RdaPZL3uPXlmXort_nydmcfFvaeQtJ1e" target="_blank" rel="noopener noreferrer">
                    <Folder className="mr-2 h-4 w-4" /> Go to Google Folder
                  </a>
                </Button>
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
                        <div className="flex items-center gap-2 min-w-0">
                            <h2 className="text-lg font-semibold truncate">{selectedFolder?.name || 'All Files'}</h2>
                            <span className="text-sm text-muted-foreground">({displayedFiles.length} file(s))</span>
                        </div>
                        {selectedFileIds.length > 0 ? (
                            <Button variant="destructive" onClick={() => handleDeleteFiles(allFiles.filter(f => selectedFileIds.includes(f.id)))}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedFileIds.length})
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input type="file" ref={folderInputRef} className="hidden" multiple directory="" webkitdirectory="" onChange={handleFolderUpload} />
                                <Button size="sm" onClick={() => folderInputRef.current?.click()} disabled={isUploading}>
                                    {isUploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                    Upload PC Folders
                                </Button>
                                <input type="file" ref={fileInputRef} onChange={(e) => setFilesToUpload(e.target.files ? Array.from(e.target.files) : [])} className="hidden" multiple />
                                <Button size="sm" onClick={() => setIsAddFileDialogOpen(true)}><UploadCloud className="mr-2 h-4 w-4" /> Upload PC Files</Button>
                                <Button size="sm" onClick={handleNewFile}><FilePlus className="mr-2 h-4 w-4" /> Create File</Button>
                            </div>
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
                       <div className="grid items-center grid-cols-[auto_auto_1fr_minmax(0,max-content)_auto] gap-2 h-8 p-2">
                          <div className="h-full w-8 flex items-center justify-center"><Checkbox onCheckedChange={handleToggleSelectAll} checked={sortedFiles.length > 0 && selectedFileIds.length === sortedFiles.length} /></div>
                          <div className="w-8"><span className="sr-only">Icon</span></div>
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
      
      <Dialog open={isAddFileDialogOpen} onOpenChange={(open) => { if (!isUploading) setIsAddFileDialogOpen(open); }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>
                    Select one or more files to upload to the "{selectedFolder?.name || 'Unfiled'}" folder.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <div 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {filesToUpload.length > 0 ? (
                        <p className="font-medium text-center">{filesToUpload.length} file(s) selected.<br/><span className="text-xs font-normal">({filesToUpload[0].name}, etc.)</span></p>
                    ) : (
                        <>
                            <UploadCloud className="w-8 h-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to browse or drag files here</p>
                        </>
                    )}
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddFileDialogOpen(false)} disabled={isUploading}>Cancel</Button>
                <Button onClick={() => handleFileUpload()} disabled={isUploading || filesToUpload.length === 0}>
                    {isUploading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? "Uploading..." : "Upload File(s)"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
              <Label htmlFor="folder-name-new">Name</Label>
              <Input id="folder-name-new" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder() }} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => handleCreateFolder()}>Create</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={!!renamingFolder} onOpenChange={(open) => !open && handleCancelRename()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Folder</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rename-folder-name">New Name</Label>
                        <Input 
                            id="rename-folder-name" 
                            value={renameInputValue}
                            onChange={(e) => setRenameInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename() }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={handleCancelRename}>Cancel</Button>
                        <Button onClick={handleConfirmRename}>Rename</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the folder "{folderToDelete?.name}" and all its contents.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteFolder} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
      
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
        <DialogContent>
            <DialogHeader>
                <DialogTitle>About the File Cabinet</DialogTitle>
                <DialogDescription>
                   Your central hub for organizing digital assets.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 prose prose-sm dark:prose-invert">
                <p>The Ogeemo File Cabinet acts as a powerful bridge between your local computer and your Google Drive.</p>
                <ul>
                    <li><strong>Upload PC Files:</strong> Use the "Upload PC Files/Folders" buttons to upload documents directly from your computer into organized folders.</li>
                    <li><strong>Create Placeholders:</strong> Use the "Create File" button to make a placeholder for a document that lives elsewhere (e.g., in Google Drive).</li>
                    <li><strong>Link to Google Drive:</strong> After creating a placeholder, use the menu on the file to add the direct link to your Google Doc, Sheet, or Slide. This keeps all your related assets in one place, even if they're stored in different locations.</li>
                    <li><strong>Search Google Drive:</strong> Use the search bar to quickly find files within your Google Drive without leaving Ogeemo.</li>
                </ul>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsInfoDialogOpen(false)}>Got it</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
