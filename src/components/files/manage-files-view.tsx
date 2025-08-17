
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDrag, useDrop } from 'react-dnd';
import {
  Folder,
  Trash2,
  Pencil,
  LoaderCircle,
  ArrowLeft,
  ArrowDownAZ,
  ArrowUpZA,
  Save,
  File as FileIconLucide,
  ChevronRight,
  UploadCloud,
  Plus,
  FolderPlus,
  MoreVertical,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type FileItem, type FolderItem } from '@/data/files';
import { useToast } from '@/hooks/use-toast';
import { 
    getFolders, 
    getFiles,
    updateFolder,
    addFile,
    addFolder,
    deleteFolders,
    deleteFiles
} from '@/services/file-service';
import { moveFile } from '@/app/actions/file-actions';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserProfile, updateUserProfile } from '@/services/user-profile-service';
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


const ItemTypes = {
    FILE: 'file',
    FOLDER: 'folder',
};

const itemFrameStyle = "flex items-center gap-1 p-1 border border-foreground rounded-md h-8"; 

interface DraggableFileProps {
    file: FileItem;
    onDelete: (file: FileItem) => void;
    isSelected: boolean;
    onToggleSelect: (fileId: string) => void;
    selectedFileIds: string[];
}

const DraggableFile = ({ file, onDelete, isSelected, onToggleSelect, selectedFileIds }: DraggableFileProps) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.FILE,
        item: () => {
            // If the dragged file is part of a selection, drag all selected files.
            // Otherwise, just drag the single file.
            const isSelectedInDrag = selectedFileIds.includes(file.id);
            const draggedIds = isSelectedInDrag ? selectedFileIds : [file.id];
            return { ids: draggedIds, type: ItemTypes.FILE };
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div ref={drag} className={cn(itemFrameStyle, "bg-blue-100 text-blue-900 group", isDragging && "opacity-50")}>
            <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(file.id)} className="mx-2" />
            <FileIconLucide className="h-4 w-4 text-blue-800/80" />
            <span className="text-sm truncate flex-1">{file.name}</span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onDelete(file)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

interface DroppableFolderProps {
    folder: FolderItem;
    onDrop: (item: { ids?: string[], type: string } | FileItem | FolderItem, folderId: string | null) => void;
    onRename: (folder: FolderItem) => void;
    onDelete: (folder: FolderItem) => void;
    onNewSubfolder: (parentId: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
    hasChildren: boolean;
    children?: React.ReactNode;
}

const DroppableFolder = ({ folder, onDrop, onRename, onDelete, onNewSubfolder, isExpanded, onToggleExpand, hasChildren, children }: DroppableFolderProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.FOLDER,
        item: { ...folder, type: ItemTypes.FOLDER },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: [ItemTypes.FILE, ItemTypes.FOLDER],
        drop: (item: { ids?: string[], type: string } | FileItem | FolderItem) => onDrop(item, folder.id),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));

    drag(drop(ref));
    
    const isSubfolder = !!folder.parentId;

    return (
        <div ref={ref} className={cn("transition-colors rounded-md", isOver && canDrop && "bg-primary/10", isDragging && "opacity-50")}>
            <div className={cn(itemFrameStyle, "group", isSubfolder ? "bg-neutral-200 text-foreground" : "bg-muted text-foreground")}>
                <ChevronRight 
                    className={cn('h-4 w-4 cursor-pointer transition-transform', isExpanded && 'rotate-90', !hasChildren && 'invisible')}
                    onClick={onToggleExpand}
                />
                <Folder className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 hover:bg-muted/50 focus-visible:ring-ring">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onNewSubfolder(folder.id)}>
                            <FolderPlus className="mr-2 h-4 w-4" /> New Subfolder
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onRename(folder)}>
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDelete(folder)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {isExpanded && (
                <div className="pl-6 border-l ml-4 mt-2 space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
};

export function ManageFilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'unfiled' | 'all'>('unfiled');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  
  const [isAddFileDialogOpen, setIsAddFileDialogOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  
  const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const loadInitialData = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const [fetchedFolders, fetchedFiles, userProfile] = await Promise.all([
            getFolders(user.uid),
            getFiles(user.uid),
            getUserProfile(user.uid)
        ]);
        
        const savedOrder = userProfile?.preferences?.fileFolderOrder;
        if (savedOrder && savedOrder.length > 0) {
            const folderMap = new Map(fetchedFolders.map(f => [f.id, f]));
            const orderedFolders = savedOrder.map(id => folderMap.get(id)).filter(Boolean) as FolderItem[];
            const remainingFolders = fetchedFolders.filter(f => !savedOrder.includes(f.id));
            setFolders([...orderedFolders, ...remainingFolders]);
        } else {
            setFolders(fetchedFolders);
        }
        
        setAllFiles(fetchedFiles);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Failed to load data",
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleDrop = async (item: { ids?: string[], type: string } | FileItem | FolderItem, folderId: string | null) => {
    const originalFiles = [...allFiles];
    const originalFolders = [...folders];
    let movedCount = 0;

    try {
        if (item.type === ItemTypes.FILE && item.ids) { // Bulk file drop
            const fileIdsToMove = item.ids;
            movedCount = fileIdsToMove.length;
            
            // Optimistic UI update
            setAllFiles(prev => prev.map(f => fileIdsToMove.includes(f.id) ? { ...f, folderId: folderId! } : f));
            
            // Server update
            await Promise.all(fileIdsToMove.map(id => moveFile(id, folderId!)));

        } else if ('storagePath' in item) { // Single file drop
            if (item.folderId === folderId) return;
            movedCount = 1;
            setAllFiles(prev => prev.map(f => f.id === item.id ? { ...f, folderId: folderId! } : f));
            await moveFile(item.id, folderId!);
            
        } else if ('parentId' in item) { // Folder drop
            if (item.id === folderId || item.parentId === folderId) return;
            movedCount = 1;
            
            let currentParentId = folderId;
            while (currentParentId) {
                if (currentParentId === item.id) {
                    toast({ variant: "destructive", title: "Invalid Move", description: "You cannot move a folder into one of its own subfolders." });
                    return;
                }
                const parent = folders.find(f => f.id === currentParentId);
                currentParentId = parent?.parentId || null;
            }

            setFolders(prev => prev.map(f => f.id === item.id ? { ...f, parentId: folderId } : f));
            await updateFolder(item.id, { parentId: folderId });
        }
        
        toast({ title: `${movedCount} item(s) moved successfully.` });
        if (item.type === ItemTypes.FILE) {
            setSelectedFileIds([]);
        }

    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Move Failed', description: error.message });
        setAllFiles(originalFiles); // Revert on failure
        setFolders(originalFolders); // Revert on failure
    }
  };

  const unfiledDocuments = useMemo(() => {
    const folderIds = new Set(folders.map(f => f.id));
    return allFiles.filter(file => !file.folderId || !folderIds.has(file.folderId));
  }, [allFiles, folders]);

  const filesToDisplay = viewMode === 'unfiled' ? unfiledDocuments : allFiles;

  const handleToggleExpand = (folderId: string) => {
      setExpandedFolders(prev => {
          const newSet = new Set(prev);
          if (newSet.has(folderId)) {
              newSet.delete(folderId);
          } else {
              newSet.add(folderId);
          }
          return newSet;
      });
  };
  
  const handleFileUpload = async () => {
    if (!user || filesToUpload.length === 0) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Please select one or more files.' });
        return;
    }
    setIsUploading(true);
    let successfulUploads = 0;
    try {
        for (const file of filesToUpload) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.uid);
            formData.append('folderId', ''); // Empty string for unfiled
            const newFile = await addFile(formData);
            setAllFiles(prev => [...prev, newFile]);
            successfulUploads++;
        }
        toast({ title: 'Upload Successful', description: `${successfulUploads} file(s) have been added to your unfiled documents.` });
        setIsAddFileDialogOpen(false);
        setFilesToUpload([]);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: `Only ${successfulUploads} files were uploaded. ${error.message}` });
    } finally {
        setIsUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    try {
        const newFolder = await addFolder({ name: newFolderName, userId: user.uid, parentId: newFolderParentId, createdAt: new Date() });
        setFolders(prev => [...prev, newFolder]);
        if (newFolder.parentId) {
            setExpandedFolders(prev => new Set(prev).add(newFolder.parentId!));
        }
        toast({ title: "Folder Created" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Create Failed", description: error.message });
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
  
  const handleConfirmDeleteFile = async (filesToDelete: FileItem[]) => {
      if (filesToDelete.length === 0) return;
      const fileIds = filesToDelete.map(f => f.id);
      
      try {
          await deleteFiles(fileIds);
          setAllFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
          toast({ title: `${fileIds.length} file(s) deleted` });
      } catch(error: any) {
        toast({ variant: "destructive", title: "Delete Failed", description: error.message });
      } finally {
        setFileToDelete(null);
        setSelectedFileIds([]);
      }
  };
  
  const handleToggleSelect = (fileId: string) => {
    setSelectedFileIds(prev =>
        prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedFileIds.length === filesToDisplay.length) {
        setSelectedFileIds([]);
    } else {
        setSelectedFileIds(filesToDisplay.map(f => f.id));
    }
  };

  const handleSortFolders = (direction: 'asc' | 'desc') => {
        const sorted = [...folders].sort((a, b) => {
            return direction === 'asc' 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
        });
        setFolders(sorted);
  };

    const handleSaveChanges = async () => {
        if (!user) return;
        try {
            const orderToSave = folders.map(f => f.id);
            const profile = await getUserProfile(user.uid);
            await updateUserProfile(user.uid, user.email || '', {
                preferences: { ...profile?.preferences, fileFolderOrder: orderToSave }
            });

            toast({ title: "Folder Order Saved", description: "Your new folder order has been saved." });
            router.refresh();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Save Failed", description: error.message });
            loadInitialData();
        }
    };

    const FolderTree = ({ parentId = null }: { parentId?: string | null }) => {
        const children = folders.filter(f => f.parentId === parentId);
        
        if (children.length === 0 && parentId === null) {
          return <p className="p-4 text-center text-sm text-muted-foreground">No folders yet. Create one to get started.</p>;
        }
        
        if (children.length === 0) return null;

        return (
            <div className="space-y-2">
                {children.map(folder => {
                    const filesInFolder = allFiles.filter(f => f.folderId === folder.id);
                    const hasSubfolders = folders.some(f => f.parentId === folder.id);
                    const hasContents = filesInFolder.length > 0 || hasSubfolders;
                    
                    return (
                        <DroppableFolder
                            key={folder.id} 
                            folder={folder} 
                            onDrop={handleDrop}
                            onRename={handleStartRename}
                            onDelete={setFolderToDelete}
                            onNewSubfolder={(id) => { setNewFolderParentId(id); setIsNewFolderDialogOpen(true); }}
                            isExpanded={expandedFolders.has(folder.id)}
                            onToggleExpand={() => handleToggleExpand(folder.id)}
                            hasChildren={hasContents}
                        >
                            {filesInFolder.map(file => (
                                <DraggableFile key={file.id} file={file} onDelete={setFileToDelete} isSelected={selectedFileIds.includes(file.id)} onToggleSelect={handleToggleSelect} selectedFileIds={selectedFileIds} />
                            ))}
                            <FolderTree parentId={folder.id} />
                        </DroppableFolder>
                    )
                })}
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
            <div className="p-4 sm:p-6 h-full flex flex-col items-center">
                <div className="relative w-full max-w-6xl mb-4 h-10">
                    <header className="absolute inset-0 flex justify-center items-center">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold font-headline text-primary">Manage Files</h1>
                            <p className="text-muted-foreground text-sm">Organize your files and folders.</p>
                        </div>
                    </header>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                        <Button asChild className="bg-slate-900 text-white hover:bg-slate-900/90">
                            <Link href="/files">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to File Cabinet
                            </Link>
                        </Button>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <Button onClick={handleSaveChanges}>
                            <Save className="mr-2 h-4 w-4" /> Save Order
                        </Button>
                    </div>
                </div>
                
                <div className="flex-1 min-h-0 w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <Card className="flex flex-col h-full">
                        <CardHeader className="pt-4 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle>Folders</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleSortFolders('asc')}><ArrowDownAZ className="mr-2 h-4 w-4" /> A-Z</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleSortFolders('desc')}><ArrowUpZA className="mr-2 h-4 w-4" /> Z-A</Button>
                                    <Button size="sm" onClick={() => { setNewFolderParentId(null); setIsNewFolderDialogOpen(true); }}>
                                        <FolderPlus className="mr-2 h-4 w-4" /> Create Folder
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden pt-8">
                            <ScrollArea className="h-full">
                                <FolderTree />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col h-full">
                        <CardHeader className="pt-4 pb-2">
                             <div className="flex items-center justify-between">
                                <CardTitle>Files</CardTitle>
                                <div className="flex items-center gap-2">
                                    {selectedFileIds.length > 0 && (
                                        <Button variant="destructive" size="sm" onClick={() => handleConfirmDeleteFile(allFiles.filter(f => selectedFileIds.includes(f.id)))}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedFileIds.length})
                                        </Button>
                                    )}
                                    <Button size="sm" onClick={() => setIsAddFileDialogOpen(true)}>
                                        <UploadCloud className="mr-2 h-4 w-4" /> Upload File
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        onClick={() => setViewMode('unfiled')}
                                        className={cn(viewMode === 'unfiled' ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-black border border-black hover:bg-gray-100')}
                                    >
                                        Unfiled
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        onClick={() => setViewMode('all')}
                                        className={cn(viewMode === 'all' ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-black border border-black hover:bg-gray-100')}
                                    >
                                        All Files
                                    </Button>
                                </div>
                            </div>
                             <CardDescription>Drag files to the left</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden pt-0">
                            <div className="flex items-center p-1">
                                <Checkbox
                                    checked={filesToDisplay.length > 0 && selectedFileIds.length === filesToDisplay.length}
                                    onCheckedChange={handleToggleSelectAll}
                                    className="mx-2"
                                />
                                <Label>Select All</Label>
                            </div>
                            <ScrollArea className="h-full">
                                <div className="space-y-2">
                                    {filesToDisplay.map(file => (
                                        <DraggableFile key={file.id} file={file} onDelete={setFileToDelete} isSelected={selectedFileIds.includes(file.id)} onToggleSelect={handleToggleSelect} selectedFileIds={selectedFileIds}/>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Dialog open={isAddFileDialogOpen} onOpenChange={(open) => { if (!isUploading) setIsAddFileDialogOpen(open); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload to Files</DialogTitle>
                        <DialogDescription>
                            The selected files will be added to your "Files" list.
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
                      <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          multiple
                          onChange={(e) => setFilesToUpload(e.target.files ? Array.from(e.target.files) : [])} 
                      />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddFileDialogOpen(false)} disabled={isUploading}>Cancel</Button>
                        <Button onClick={handleFileUpload} disabled={isUploading || filesToUpload.length === 0}>
                            {isUploading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            {isUploading ? "Uploading..." : "Upload File(s)"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
    
            <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            Enter a name for your new folder.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-folder-name">Folder Name</Label>
                        <Input 
                            id="new-folder-name" 
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder() }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateFolder}>Create Folder</Button>
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
            <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the file "{fileToDelete?.name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleConfirmDeleteFile([fileToDelete!])} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
  );
}
