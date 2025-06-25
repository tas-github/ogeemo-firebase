
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Folder,
  LoaderCircle,
  FolderPlus,
  MoreVertical,
  Trash2,
  FileUp,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { type FolderItem, type FileItem, mockFolders, mockFiles } from '@/data/files';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileIcon } from './file-icon';
import { format } from 'date-fns';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';


const NewFolderDialog = dynamic(() => import('@/components/files/new-folder-dialog'), {
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});


export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderInitialParentId, setNewFolderInitialParentId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  const [highlightHeader, setHighlightHeader] = useState(false);
  
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    let loadedFolders = mockFolders;
    let loadedFiles = mockFiles;
    try {
      const storedFolders = localStorage.getItem('fileManagerFolders');
      if (storedFolders) loadedFolders = JSON.parse(storedFolders);

      const storedFiles = localStorage.getItem('fileManagerFiles');
      if (storedFiles) {
        loadedFiles = JSON.parse(storedFiles).map((file: any) => ({
          ...file,
          modifiedAt: new Date(file.modifiedAt),
        }));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage, using mock data.", error);
    } finally {
      setFolders(loadedFolders);
      setFiles(loadedFiles);
      if (loadedFolders.length > 0) {
        const rootFolder = loadedFolders.find(f => !f.parentId);
        if (rootFolder) {
            setExpandedFolders(new Set([rootFolder.id]));
        }
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('fileManagerFolders', JSON.stringify(folders));
      } catch (error) {
        console.error("Failed to save folders to localStorage", error);
      }
    }
  }, [folders, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('fileManagerFiles', JSON.stringify(files));
      } catch (error) {
        console.error("Failed to save files to localStorage", error);
      }
    }
  }, [files, isLoading]);

  useEffect(() => {
    if (selectedFolderId) {
      setHighlightHeader(true);
      const timer = setTimeout(() => {
        setHighlightHeader(false);
      }, 500); // Highlight duration
      return () => clearTimeout(timer);
    }
  }, [selectedFolderId]);
  
  const openNewFolderDialog = (options: { parentId?: string | null } = {}) => {
    const { parentId = selectedFolderId } = options;
    setNewFolderInitialParentId(parentId);
    setIsNewFolderDialogOpen(true);
  };

  const handleCreateFolder = (newFolder: FolderItem) => {
    setFolders(prev => [...prev, newFolder]);
    if (newFolder.parentId) {
      setExpandedFolders(prev => new Set(prev).add(newFolder.parentId!));
    }
    toast({ title: "Folder Created", description: `Folder "${newFolder.name}" has been created.` });
  };
  
  const handleSelectFolder = (folderId: string) => {
    if (renamingFolder?.id === folderId) return;
    setSelectedFolderId(folderId);
    setSelectedFileIds([]);
  };

  const toggleFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
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

  const filesInSelectedFolder = useMemo(() => {
    if (!selectedFolderId) return [];
    return files.filter(file => file.folderId === selectedFolderId);
  }, [files, selectedFolderId]);
  
  const handleSelectFile = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };
  
  const handleSelectAllFiles = () => {
    if (selectedFileIds.length === filesInSelectedFolder.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filesInSelectedFolder.map(f => f.id));
    }
  };
  
  const handleDeleteSelected = () => {
    setFiles(prevFiles => prevFiles.filter(file => !selectedFileIds.includes(file.id)));
    toast({
        title: `${selectedFileIds.length} file(s) deleted`,
        description: 'The selected files have been removed.',
    });
    setSelectedFileIds([]);
  };

  const handleDeleteFolder = (folder: FolderItem) => {
    setFolderToDelete(folder);
  };
  
  const handleConfirmDeleteFolder = () => {
      if (!folderToDelete) return;

      const folderIdsToDelete = new Set<string>([folderToDelete.id]);
      const findDescendants = (parentId: string) => {
          folders
              .filter(f => f.parentId === parentId)
              .forEach(child => {
                  folderIdsToDelete.add(child.id);
                  findDescendants(child.id);
              });
      };
      findDescendants(folderToDelete.id);

      const newFolders = folders.filter(f => !folderIdsToDelete.has(f.id));
      const newFiles = files.filter(f => f.folderId && !folderIdsToDelete.has(f.folderId));

      setFolders(newFolders);
      setFiles(newFiles);

      if (selectedFolderId && folderIdsToDelete.has(selectedFolderId)) {
          setSelectedFolderId(null);
      }

      toast({
          title: "Folder Deleted",
          description: `Folder "${folderToDelete.name}" and all its contents have been removed.`,
      });

      setFolderToDelete(null);
  };
  
  const selectedFolder = useMemo(() => folders.find(f => f.id === selectedFolderId), [folders, selectedFolderId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !selectedFolderId) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Please select a folder before uploading files.',
      });
      return;
    }

    const newFiles: FileItem[] = Array.from(event.target.files).map((file) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      modifiedAt: new Date(),
      folderId: selectedFolderId,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    toast({
      title: `${newFiles.length} file(s) uploaded successfully!`,
      description: `Added to "${selectedFolder?.name}".`,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddFileClick = (folderId: string) => {
    handleSelectFolder(folderId);
    fileInputRef.current?.click();
  };
  
  const handleStartRename = (folder: FolderItem) => {
    setRenamingFolder(folder);
    setRenameInputValue(folder.name);
  };

  const handleCancelRename = () => {
    setRenamingFolder(null);
    setRenameInputValue("");
  };
  
  const handleConfirmRename = () => {
    if (!renamingFolder || !renameInputValue.trim() || renamingFolder.name === renameInputValue.trim()) {
        handleCancelRename();
        return;
    }

    setFolders(prev =>
        prev.map(f =>
            f.id === renamingFolder.id ? { ...f, name: renameInputValue.trim() } : f
        )
    );
    toast({
        title: "Folder Renamed",
        description: `"${renamingFolder.name}" was renamed to "${renameInputValue.trim()}".`,
    });
    handleCancelRename();
  };

  const handleRenameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleConfirmRename();
      } else if (e.key === 'Escape') {
          handleCancelRename();
      }
  };


  const FolderTree = ({ parentId = null, level = 0 }: { parentId?: string | null, level?: number }) => {
    const children = folders.filter(f => f.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
        {children.map(folder => {
          const hasChildren = folders.some(f => f.parentId === folder.id);
          const isExpanded = expandedFolders.has(folder.id);
          const isRenaming = renamingFolder?.id === folder.id;

          return (
            <div key={folder.id} className="my-1">
              <div
                className="group flex items-center gap-2 rounded-md pr-2 cursor-pointer hover:bg-accent"
                onClick={() => handleSelectFolder(folder.id)}
                >
                <div
                    className="flex items-center gap-2 flex-1 p-1 rounded-md"
                    style={{ backgroundColor: selectedFolderId === folder.id ? 'hsl(var(--accent))' : 'transparent' }}
                >
                    {hasChildren ? (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => toggleFolder(e, folder.id)}>
                            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </Button>
                    ) : (
                        <div className="w-6 h-6" /> // Placeholder for alignment
                    )}
                    <Folder className={`h-4 w-4 ${folder.parentId ? 'text-green-500' : 'text-primary'}`} />
                     {isRenaming ? (
                        <Input
                            value={renameInputValue}
                            onChange={(e) => setRenameInputValue(e.target.value)}
                            onBlur={handleConfirmRename}
                            onKeyDown={handleRenameInputKeyDown}
                            className="h-7 text-sm flex-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-sm truncate flex-1">{folder.name}</span>
                    )}
                </div>
                {!isRenaming && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleAddFileClick(folder.id)}>
                                <FileUp className="mr-2 h-4 w-4" />
                                Add File
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openNewFolderDialog({ parentId: folder.id })}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Add subfolder
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleStartRename(folder)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onSelect={() => handleDeleteFolder(folder)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
              </div>
              {isExpanded && <FolderTree parentId={folder.id} level={level + 1} />}
            </div>
          );
        })}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading File Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
      />
      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the folder <strong>{folderToDelete?.name}</strong> and all its contents, including subfolders and files.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleConfirmDeleteFolder}
                  >
                      Delete
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Ogeemo File Manager
          </h1>
          <p className="text-muted-foreground">
            A new foundation for managing your files and folders.
          </p>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
            <ResizablePanel defaultSize={25} minSize={20}>
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-center p-2 border-b h-[57px]">
                      <h3 className="text-lg font-semibold">All Folders</h3>
                    </div>
                    <ScrollArea className="flex-1 p-2">
                        <FolderTree />
                    </ScrollArea>
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-2 border-b h-[57px]">
                        <div>
                            {selectedFileIds.length > 0 ? (
                                <h3 className="text-lg font-semibold">{selectedFileIds.length} selected</h3>
                            ) : (
                                <h3 className={cn("text-lg font-semibold p-1 rounded-md transition-all duration-500", highlightHeader && "bg-primary/10 border border-primary text-primary")}>
                                    {selectedFolder?.name || 'Select a folder'}
                                </h3>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedFileIds.length > 0 ? (
                                <Button variant="destructive" onClick={handleDeleteSelected}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            ) : (
                                <>
                                    <Button onClick={() => openNewFolderDialog({ parentId: null })} className="bg-orange-500 hover:bg-orange-600 text-white">
                                        <FolderPlus className="mr-2 h-4 w-4" /> Create Folder
                                    </Button>
                                    <Button onClick={() => openNewFolderDialog({ parentId: selectedFolderId })} disabled={!selectedFolderId} className="bg-orange-500 hover:bg-orange-600 text-white">
                                        <FolderPlus className="mr-2 h-4 w-4" /> Create Subfolder
                                    </Button>
                                    <Button onClick={() => fileInputRef.current?.click()} disabled={!selectedFolderId} className="bg-orange-500 hover:bg-orange-600 text-white">
                                        <FileUp className="mr-2 h-4 w-4" /> Upload File
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto animate-in fade-in-50 duration-300" key={selectedFolderId}>
                        {selectedFolderId ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={filesInSelectedFolder.length > 0 && selectedFileIds.length === filesInSelectedFolder.length}
                                                onCheckedChange={handleSelectAllFiles}
                                                aria-label="Select all files"
                                                disabled={filesInSelectedFolder.length === 0}
                                            />
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Modified</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filesInSelectedFolder.length > 0 ? (
                                        filesInSelectedFolder.map(file => (
                                            <TableRow key={file.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedFileIds.includes(file.id)}
                                                        onCheckedChange={() => handleSelectFile(file.id)}
                                                        aria-label={`Select file ${file.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <FileIcon fileType={file.type} />
                                                    {file.name}
                                                </TableCell>
                                                <TableCell>{file.type}</TableCell>
                                                <TableCell>{(file.size / 1024).toFixed(2)} KB</TableCell>
                                                <TableCell>{format(file.modifiedAt, 'PPp')}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                This folder is empty.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                         ) : (
                            <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
                                <p>Select a folder from the left to view its contents.</p>
                            </div>
                        )}
                    </div>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {isNewFolderDialogOpen && (
        <NewFolderDialog
          isOpen={isNewFolderDialogOpen}
          onOpenChange={setIsNewFolderDialogOpen}
          onFolderCreated={handleCreateFolder}
          folders={folders}
          initialParentId={newFolderInitialParentId}
        />
      )}
    </>
  );
}
