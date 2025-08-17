
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
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
  Download,
  Users,
  UploadCloud,
  Wand2,
  BookOpen,
  Save,
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
    deleteFolders
} from '@/services/file-service';
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
import Link from 'next/link';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { getDownloadUrl, checkinFromGoogleDrive } from '@/app/actions/file-actions';
import { triggerBrowserDownload } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const GOOGLE_DOC_TYPES = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('all');
  
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
  
  const { toast } = useToast();
  const { user, accessToken } = useAuth();
  const { preferences } = useUserPreferences();
  const router = useRouter();
  
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
  
  const handleOpenFile = async (file: FileItem) => {
      if (GOOGLE_DOC_TYPES.includes(file.type)) {
          // It's a Google Doc type, send to the opener page
          const openerUrl = `/opener?fileId=${file.id}&fileName=${encodeURIComponent(file.name)}&storagePath=${encodeURIComponent(file.storagePath)}`;
          window.open(openerUrl, '_blank');
      } else {
          // For other files, get a download URL and open in a new tab
          try {
              const { url, error } = await getDownloadUrl(file.storagePath);
              if (error) throw new Error(error);
              if (url) {
                  // For images and PDFs, the browser will likely display them.
                  // For others, it will trigger a download.
                  window.open(url, '_blank');
              }
          } catch (error: any) {
              toast({ variant: 'destructive', title: 'Could not open file', description: error.message });
          }
      }
  };

  const handleCheckIn = async (file: FileItem) => {
      if (!file.googleDriveFileId || !accessToken) {
          toast({ variant: 'destructive', title: 'Check-in Failed', description: 'File is not properly checked out or authentication is missing.' });
          return;
      }
      try {
          const result = await checkinFromGoogleDrive({
              fileId: file.id,
              storagePath: file.storagePath,
              googleDriveFileId: file.googleDriveFileId,
              accessToken,
          });
          if (result.success) {
              toast({ title: 'Check-in Successful', description: `${file.name} has been saved back to Ogeemo.` });
              await loadInitialData(); // Refresh the file list to show updated status
          } else {
              throw new Error(result.error);
          }
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Check-in Failed', description: error.message });
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

    const firstFile = files[0];
    const rootFolderName = firstFile.webkitRelativePath.split('/')[0];
    
    if (!rootFolderName) {
        toast({ variant: 'destructive', title: 'Could not determine folder name.' });
        return;
    }
    
    setIsUploading(true);
    toast({ title: 'Folder Upload Started', description: `Uploading folder "${rootFolderName}"...` });
    
    try {
        const newFolder = await addFolder({ name: rootFolderName, userId: user.uid, parentId: selectedFolderId !== 'all' ? selectedFolderId : null, createdAt: new Date() });
        setFolders(prev => [...prev, newFolder]);

        const uploadPromises = Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.uid);
            formData.append('folderId', newFolder.id);
            return addFile(formData);
        });
        
        const newFiles = await Promise.all(uploadPromises);
        setAllFiles(prev => [...prev, ...newFiles]);

        toast({ title: 'Folder Upload Complete', description: `${files.length} file(s) uploaded to "${rootFolderName}".` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Folder Upload Failed', description: error.message });
    } finally {
        setIsUploading(false);
        // Reset file input
        if (folderInputRef.current) {
            folderInputRef.current.value = "";
        }
    }
  };


  const FolderTreeItem = ({ folder, allFolders, level = 0 }: { folder: FolderItem, allFolders: FolderItem[], level?: number }) => {
    const hasChildren = allFolders.some(f => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isRenaming = renamingFolder?.id === folder.id;
    const isSelected = selectedFolderId === folder.id;

    return (
        <div style={{ marginLeft: level > 0 ? '0.5rem' : '0' }}>
            <div
                className={cn(
                    "flex items-center gap-1 pr-1 border border-foreground rounded-md h-8 group",
                    isSelected && !isRenaming && "bg-blue-100 text-blue-900",
                    !isSelected && !isRenaming && (folder.parentId ? "bg-neutral-200 text-foreground" : "bg-gradient-to-r from-[#C3FFF9] to-[#62C1B6] text-black"),
                    isRenaming && "bg-background text-foreground"
                )}
            >
                <div
                  className="flex items-center flex-1 cursor-pointer h-full"
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
                    <span className="truncate text-sm ml-2">{folder.name}</span>
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
        <header className="text-center py-4 sm:py-6 px-4 sm:px-6">
            <h1 className="text-3xl font-bold font-headline text-primary">Ogeemo File Cabinet</h1>
            <p className="text-muted-foreground">Organize your documents and assets.</p>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="flex h-full flex-col">
                 <div className="flex items-center justify-center p-2 border-b h-14 bg-sidebar text-sidebar-foreground">
                    <h3 className="text-lg font-semibold px-2">Folders</h3>
                </div>
                <ScrollArea className="flex-1 p-2">
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
                <div className="flex items-center justify-between p-2 border-b h-14">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{selectedFolder?.name || 'All Files'}</h2>
                        <span className="text-sm text-muted-foreground">({displayedFiles.length} file(s))</span>
                    </div>
                    {selectedFileIds.length > 0 ? (
                        <Button variant="destructive" onClick={() => handleDeleteFiles(allFiles.filter(f => selectedFileIds.includes(f.id)))}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedFileIds.length})
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <input type="file" ref={folderInputRef} onChange={handleFolderUpload} className="hidden" multiple directory="" webkitdirectory="" />
                            <Button onClick={() => folderInputRef.current?.click()}><UploadCloud className="mr-2 h-4 w-4" /> Folder Upload</Button>
                            <Button asChild>
                                <Link href="/files/manage">Manage Files</Link>
                            </Button>
                            <Button onClick={() => setIsNewFolderDialogOpen(true)}>
                                <FolderPlus className="mr-2 h-4 w-4" /> Add Folder
                            </Button>
                            <Button onClick={() => setIsAddFileDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add File
                            </Button>
                        </div>
                    )}
                </div>
                 <div className="flex-1 overflow-y-auto p-2">
                    <div className="flex items-center p-2 h-10">
                        <div className="w-12"><Checkbox onCheckedChange={handleToggleSelectAll} checked={sortedFiles.length > 0 && selectedFileIds.length === sortedFiles.length} /></div>
                        <div className="w-12"><span className="sr-only">Icon</span></div>
                        <Button variant="ghost" onClick={() => handleSort('name')} className="flex-1 justify-start p-0 h-auto font-medium text-muted-foreground hover:bg-transparent">Name <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                        <Button variant="ghost" onClick={() => handleSort('modifiedAt')} className="w-48 justify-start p-0 h-auto font-medium text-muted-foreground hover:bg-transparent">Last Modified <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                        <div className="w-12"><span className="sr-only">Actions</span></div>
                    </div>
                    <div className="space-y-1">
                        {sortedFiles.length > 0 ? (
                            sortedFiles.map(file => {
                                const isCheckedOut = !!file.googleDriveFileId;
                                return (
                                <div key={file.id} className="flex items-center h-8 rounded-md p-2 border border-foreground bg-blue-100 text-blue-900">
                                    <div className="w-12"><Checkbox checked={selectedFileIds.includes(file.id)} onCheckedChange={() => setSelectedFileIds(p => p.includes(file.id) ? p.filter(id => id !== file.id) : [...p, file.id])} /></div>
                                    <div className="w-12"><FileIcon fileType={file.type} /></div>
                                    <div className="flex-1 font-medium text-sm truncate flex items-center gap-2">
                                        {file.name}
                                        {isCheckedOut && (
                                            <Image src="/images/google-drive-icon.png" alt="Google Drive Icon" width={16} height={16} title="Checked out to Google Drive" />
                                        )}
                                    </div>
                                    <div className="w-48 text-sm">{format(file.modifiedAt, 'PPp')}</div>
                                    <div className="w-12">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {isCheckedOut ? (
                                                    <DropdownMenuItem onSelect={() => handleCheckIn(file)}>
                                                        <Save className="mr-2 h-4 w-4" /> Save & Check In from Drive
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onSelect={() => handleOpenFile(file)}>
                                                        <BookOpen className="mr-2 h-4 w-4" /> Open
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteFiles([file])}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            )})
                        ) : (
                            <div className="flex items-center justify-center h-48 text-muted-foreground">This folder is empty.</div>
                        )}
                    </div>
                 </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-name-new">Name</Label>
              <Input id="folder-name-new" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder() }} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder}>Create</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the folder "{folderToDelete?.name}" and all its contents. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDeleteFolder} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddFileDialogOpen} onOpenChange={(open) => { if (!isUploading) setIsAddFileDialogOpen(open); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Add New File(s)</DialogTitle>
                  <DialogDescription>
                      Upload files to the folder: "{selectedFolder?.name || 'Please select a folder'}".
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
                  <Button onClick={handleFileUpload} disabled={isUploading || filesToUpload.length === 0 || selectedFolderId === 'all'}>
                      {isUploading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                      {isUploading ? "Uploading..." : "Upload File(s)"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
