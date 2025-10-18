'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Folder,
  LoaderCircle,
  File as FileIcon,
  FolderPlus,
  Upload,
  ChevronRight,
  Save,
  FilePlus2,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
    getFolders, 
    getFilesForFolder, 
    type FolderItem, 
    type FileItem, 
    addFolder, 
    addFile, 
    updateFolder,
    removeFoldersAndContents 
} from '@/services/file-service';
import { cn } from '@/lib/utils';
import { fetchFileContent } from '@/app/actions/file-actions';
import { updateEditorFile } from '@/services/text-editor-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  
  const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const loadFolders = useCallback(async () => {
    if (!user) return;
    setIsLoadingFolders(true);
    try {
      const fetchedFolders = await getFolders(user.uid);
      setFolders(fetchedFolders);
      if (fetchedFolders.length > 0 && !selectedFolderId) {
        const rootFolder = fetchedFolders.find(f => !f.parentId);
        if (rootFolder) {
            setSelectedFolderId(rootFolder.id);
            setExpandedFolders(new Set([rootFolder.id]));
        }
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load folders', description: error.message });
    } finally {
      setIsLoadingFolders(false);
    }
  }, [user, toast, selectedFolderId]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const loadFiles = useCallback(async () => {
    if (!selectedFolderId || !user) {
      setFiles([]);
      return;
    }
    setIsLoadingFiles(true);
    setSelectedFile(null); // Clear file selection when folder changes
    if (editorRef.current) editorRef.current.innerHTML = '';
    try {
      const fetchedFiles = await getFilesForFolder(user.uid, selectedFolderId);
      setFiles(fetchedFiles);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load files', description: error.message });
    } finally {
      setIsLoadingFiles(false);
    }
  }, [selectedFolderId, user, toast]);

  useEffect(() => {
    loadFiles();
  }, [selectedFolderId, loadFiles]);

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
  };
  
  const handleSelectFile = async (file: FileItem) => {
    setSelectedFile(file);
    if (editorRef.current) {
        editorRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-muted-foreground"><p>Loading content...</p></div>';
    }
    
    if (file.type.startsWith('text/')) {
        try {
            const { content, error } = await fetchFileContent(file.storagePath);
            if (error) throw new Error(error);
            if (editorRef.current) {
                editorRef.current.innerHTML = content || '';
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load content', description: error.message });
            if (editorRef.current) {
                editorRef.current.innerHTML = '<div class="text-destructive">Could not load file content.</div>';
            }
        }
    } else {
        if (editorRef.current) {
             editorRef.current.innerHTML = `<div class="p-4 text-sm text-muted-foreground">Preview for <strong>${file.type}</strong> is not available.</div>`;
        }
    }
  };

  const handleSave = async () => {
    if (!user || !selectedFile) {
      toast({ variant: 'destructive', title: 'No file selected.' });
      return;
    }
    if (!selectedFile.type.startsWith('text/')) {
        toast({ variant: 'destructive', title: 'Cannot save this file type.', description: 'Only text-based files can be edited and saved here.' });
        return;
    }

    setIsSaving(true);
    const content = editorRef.current?.innerHTML || '';
    try {
        await updateEditorFile(selectedFile.id, { content: content, name: selectedFile.name });
        toast({ title: "File Saved", description: `"${selectedFile.name}" has been updated.` });
        setSelectedFile(prev => prev ? { ...prev, modifiedAt: new Date() } : null);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Save Failed", description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleToggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.has(folderId) ? newSet.delete(folderId) : newSet.add(folderId);
        return newSet;
    });
  };

  const handleOpenCreateFolderDialog = (parentId: string | null) => {
    setNewFolderParentId(parentId);
    setIsCreateFolderOpen(true);
  };
  
  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    try {
        const newFolder = await addFolder({
            name: newFolderName.trim(),
            parentId: newFolderParentId,
            userId: user.uid,
            createdAt: new Date(),
        });
        setFolders(prev => [...prev, newFolder].sort((a,b) => a.name.localeCompare(b.name)));
        if (newFolderParentId) {
            setExpandedFolders(prev => new Set(prev).add(newFolderParentId));
        }
        setIsCreateFolderOpen(false);
        setNewFolderName('');
        toast({ title: 'Folder Created' });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create folder.' });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!user || !selectedFolderId) {
        toast({ variant: 'destructive', title: 'No Folder Selected', description: 'Please select a folder to upload the file into.'});
        return;
    }

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.uid);
    formData.append('folderId', selectedFolderId);

    try {
        const newFile = await addFile(formData);
        setFiles(prev => [...prev, newFile]);
        toast({ title: 'File Uploaded', description: `"${newFile.name}" has been added.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
        await removeFoldersAndContents(user.uid, [folderToDelete.id]);
        
        // Optimistic UI update
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
            setSelectedFolderId(null);
        }

        toast({ title: "Folder Deleted" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    } finally {
        setFolderToDelete(null);
    }
  };

  const FolderTreeItem = ({ folder, allFolders, level = 0 }: { folder: FolderItem, allFolders: FolderItem[], level?: number }) => {
    const hasChildren = allFolders.some(f => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isRenaming = renamingFolder?.id === folder.id;

    return (
        <div style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
            <div
                className={cn(
                    "flex items-center gap-2 pr-2 rounded-md cursor-pointer group",
                    isRenaming ? 'bg-background' : 'hover:bg-accent',
                    selectedFolderId === folder.id && "bg-primary/20"
                )}
                onClick={() => !isRenaming && handleSelectFolder(folder.id)}
            >
                {hasChildren ? (
                    <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')} onClick={(e) => handleToggleExpand(folder.id, e)} />
                ) : <div className="w-4" />}
                <Folder className="h-4 w-4 text-primary" />
                {isRenaming ? (
                     <Input
                        autoFocus
                        value={renameInputValue}
                        onChange={e => setRenameInputValue(e.target.value)}
                        onBlur={handleConfirmRename}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleConfirmRename();
                            if (e.key === 'Escape') handleCancelRename();
                        }}
                        className="h-7 my-1"
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <span className="text-sm truncate flex-1 p-2">{folder.name}</span>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={e => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={() => handleStartRename(folder)}><Pencil className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleOpenCreateFolderDialog(folder.id)}><FolderPlus className="mr-2 h-4 w-4" /> Add Subfolder</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setFolderToDelete(folder)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {isExpanded && allFolders.filter(f => f.parentId === folder.id).sort((a,b) => a.name.localeCompare(b.name)).map(child => (
                <FolderTreeItem key={child.id} folder={child} allFolders={allFolders} level={level + 1} />
            ))}
        </div>
    );
  };

  if (isLoadingFolders) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full p-4 sm:p-6 space-y-4">
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">File Cabinet</h1>
          <p className="text-muted-foreground">Your unified space for notes, documents, and files.</p>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-2 border-b">
                  <h3 className="font-semibold text-lg px-2">Folders</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenCreateFolderDialog(null)}>
                      <FolderPlus className="h-4 w-4" />
                  </Button>
              </div>
              <ScrollArea className="flex-1">
                  <div className="p-2">
                      {folders.length > 0 ? (
                          folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)).map(folder => (
                            <FolderTreeItem key={folder.id} folder={folder} allFolders={folders} />
                          ))
                      ) : (
                          <div className="text-center text-sm text-muted-foreground p-4">No folders created yet.</div>
                      )}
                  </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
              <div className="flex flex-col h-full">
                  <div className="p-2 border-b flex justify-between items-center">
                      <h3 className="font-semibold text-lg px-2">Files</h3>
                       <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/doc-editor')} title="New Note">
                              <FilePlus2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUploadClick} disabled={!selectedFolderId} title="Upload File">
                              <Upload className="h-4 w-4" />
                          </Button>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  </div>
                  <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1">
                          {isLoadingFiles ? (
                              <div className="flex justify-center p-4"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
                          ) : files.length > 0 ? (
                              files.map(file => (
                                  <div key={file.id} 
                                      className={cn(
                                          "flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer",
                                          selectedFile?.id === file.id && "bg-primary/20"
                                      )}
                                      onClick={() => handleSelectFile(file)}
                                  >
                                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm truncate">{file.name}</span>
                                  </div>
                              ))
                          ) : (
                              <div className="text-center text-sm text-muted-foreground p-4">
                                  {selectedFolderId ? "This folder is empty." : "Select a folder to see its files."}
                              </div>
                          )}
                      </div>
                  </ScrollArea>
              </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
              <div className="flex flex-col h-full">
                  <div className="p-2 border-b flex justify-between items-center">
                      <h3 className="font-semibold text-lg px-2">Preview / Editor</h3>
                      {selectedFile && selectedFile.type.startsWith('text/') && (
                          <Button onClick={handleSave} disabled={isSaving}>
                              {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              {isSaving ? 'Saving...' : 'Save Document'}
                          </Button>
                      )}
                  </div>
                  <ScrollArea className="flex-1">
                      <div
                          ref={editorRef}
                          contentEditable={selectedFile?.type.startsWith('text/')}
                          className="prose dark:prose-invert max-w-none p-6 focus:outline-none h-full"
                          placeholder="Select a file to preview its content..."
                      />
                  </ScrollArea>
              </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

       <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="new-folder-name">Folder Name</Label>
                    <Input
                        id="new-folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateFolder}>Create Folder</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the folder "{folderToDelete?.name}" and all of its contents (including subfolders and files). This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDeleteFolder} className="bg-destructive hover:bg-destructive/90">Delete Folder</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}