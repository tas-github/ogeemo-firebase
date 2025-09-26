
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  Wand2,
  BookOpen,
  FilePlus,
  Save,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
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
    updateTextFileContent,
} from '@/services/knowledge-base-service';
import { fetchFileContent } from '@/app/actions/file-actions';
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
import { FileIcon } from '../files/file-icon';
import { format } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';

export function KnowledgeBaseView() {
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

  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [editorContent, setEditorContent] = useState<string | null>(null);
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');

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
  
  useEffect(() => {
    if (editorRef.current && editorContent !== null && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = editorContent;
    }
  }, [editorContent]);

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
        if (folderInputRef.current) {
            folderInputRef.current.value = "";
        }
    }
  };

  const handleOpenFile = async (file: FileItem) => {
    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        setActiveFile(file);
        setIsEditorLoading(true);
        try {
            const { content, error } = await fetchFileContent(file.storagePath);
            if (error) throw new Error(error);
            setEditorContent(content || "");
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load content', description: error.message });
            setActiveFile(null);
            setEditorContent(null);
        } finally {
            setIsEditorLoading(false);
        }
    } else {
        toast({ title: 'File type not supported for editing', description: 'You can download this file from the main File Cabinet.' });
    }
  };
  
  const handleSaveContent = async () => {
    if (!activeFile || editorContent === null) return;
    setIsEditorLoading(true);
    try {
        const newContent = editorRef.current?.innerHTML || editorContent;
        await updateTextFileContent(activeFile.storagePath, newContent);
        setAllFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, modifiedAt: new Date() } : f));
        toast({ title: 'File Saved', description: `Changes to "${activeFile.name}" have been saved.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsEditorLoading(false);
    }
  };
  
  const handleNewFile = () => {
      if (!selectedFolderId || selectedFolderId === 'all') {
          toast({ variant: 'destructive', title: 'No Folder Selected', description: 'Please select a folder before creating a new file.' });
          return;
      }
      setActiveFile(null);
      setEditorContent('');
      setNewFileName('');
      setIsNewFileDialogOpen(true);
  };

  const handleSaveNewFile = async () => {
    if (!user || !selectedFolderId || selectedFolderId === 'all') {
      toast({ variant: 'destructive', title: 'Folder Not Selected', description: 'Please select a folder to save the file in.' });
      return;
    }
    if (!newFileName.trim()) {
      toast({ variant: 'destructive', title: 'File Name Required', description: 'Please enter a name for your file.' });
      return;
    }
    
    setIsUploading(true);
    setIsNewFileDialogOpen(false);
    try {
        const finalFileName = newFileName.endsWith('.txt') ? newFileName : `${newFileName}.txt`;
        const newFile = await addTextFile(user.uid, selectedFolderId, finalFileName, '');
        setAllFiles(prev => [...prev, newFile]);
        setActiveFile(newFile);
        setEditorContent('');
        toast({ title: 'File Created', description: `"${finalFileName}" has been saved. You can now add content.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create file', description: error.message });
    } finally {
        setIsUploading(false);
    }
  };

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
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
            <h1 className="text-3xl font-bold font-headline text-primary">Knowledge Base</h1>
            <p className="text-muted-foreground">Store and organize your important documents.</p>
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
            <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={40}>
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
                                    <input type="file" ref={folderInputRef} className="hidden" multiple directory="" webkitdirectory="" />
                                    <Button onClick={() => folderInputRef.current?.click()} disabled={isUploading}>
                                        {isUploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                        {isUploading ? 'Uploading...' : 'Folder Upload'}
                                    </Button>
                                    <input type="file" ref={fileInputRef} onChange={(e) => setFilesToUpload(e.target.files ? Array.from(e.target.files) : [])} className="hidden" multiple />
                                    <Button onClick={() => setIsAddFileDialogOpen(true)}><UploadCloud className="mr-2 h-4 w-4" /> Upload Files</Button>
                                    <Button onClick={handleNewFile}><FilePlus className="mr-2 h-4 w-4" /> Create File</Button>
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
                                        return (
                                        <div key={file.id} className="flex items-center h-8 rounded-md p-2 border border-foreground bg-blue-100 text-blue-900 cursor-pointer hover:bg-blue-200" onClick={() => handleOpenFile(file)}>
                                            <div className="w-12" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedFileIds.includes(file.id)} onCheckedChange={() => setSelectedFileIds(p => p.includes(file.id) ? p.filter(id => id !== file.id) : [...p, file.id])} /></div>
                                            <div className="w-12"><FileIcon fileType={file.type} /></div>
                                            <div className="flex-1 font-medium text-sm truncate flex items-center gap-2">{file.name}</div>
                                            <div className="w-48 text-sm">{format(file.modifiedAt, 'PPp')}</div>
                                            <div className="w-12" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
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
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={60}>
                    <div className="h-full flex flex-col">
                        <div className="p-2 border-b flex items-center justify-between h-14">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                            </div>
                            <div>
                                {activeFile ? (
                                    <Button onClick={handleSaveContent} disabled={isEditorLoading}>
                                        {isEditorLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            {isEditorLoading ? (
                                <div className="flex items-center justify-center h-full"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                            ) : editorContent !== null ? (
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    className="prose dark:prose-invert max-w-none p-6 focus:outline-none h-full"
                                    onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
                                    suppressContentEditableWarning={true}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <BookOpen className="h-12 w-12" />
                                    <p className="mt-4">Select a text file to view or edit.</p>
                                    <p className="text-sm">Or, create a new file to get started.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Create New File</DialogTitle>
                  <DialogDescription>
                      Enter a name for your new text file. It will be saved in the "{selectedFolder?.name}" folder.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="new-file-name">File Name</Label>
                  <Input 
                      id="new-file-name" 
                      value={newFileName} 
                      onChange={(e) => setNewFileName(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveNewFile() }}
                      placeholder="e.g., My meeting notes.txt"
                  />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsNewFileDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveNewFile}>Create and Open</Button>
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
    </>
  );
}
