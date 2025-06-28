
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Folder,
  LoaderCircle,
  FolderPlus,
  MoreVertical,
  Trash2,
  FileUp,
  ChevronRight,
  Pencil,
  Download,
  FolderSearch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { type FolderItem, type FileItem } from '@/data/files';
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
import { useAuth } from '@/context/auth-context';
import { 
    getFiles, 
    getFolders, 
    addFolder, 
    updateFolder, 
    updateFile, 
    deleteFiles, 
    deleteFolderAndContents,
    uploadFiles,
    getFileDownloadUrl,
} from '@/services/file-service';


const DialogLoader = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <LoaderCircle className="h-10 w-10 animate-spin text-white" />
    </div>
);

const NewFolderDialog = dynamic(() => import('@/components/files/new-folder-dialog'), {
  loading: () => <DialogLoader />,
});

const FilePreviewDialog = dynamic(() => import('@/components/files/file-preview-dialog'), {
  loading: () => <DialogLoader />,
});

const ItemTypes = {
  FILE: 'file',
};

function FilesViewContent() {
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadData(userId: string) {
        setIsLoading(true);
        try {
            const [fetchedFolders, fetchedFiles] = await Promise.all([
                getFolders(userId),
                getFiles(userId)
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
            console.error("Failed to load file data:", error);
            toast({
                variant: "destructive",
                title: "Failed to load data",
                description: error.message || "Could not retrieve files and folders from the database.",
            });
        } finally {
            setIsLoading(false);
        }
    }
    if (user) {
        loadData(user.uid);
    } else {
        setIsLoading(false); // If no user, stop loading
    }
  }, [toast, user]);
  
  const openNewFolderDialog = (options: { parentId?: string | null } = {}) => {
    const { parentId = selectedFolderId } = options;
    setNewFolderInitialParentId(parentId);
    setIsNewFolderDialogOpen(true);
  };

  const handleCreateFolder = async (folderData: Omit<FolderItem, 'id' | 'userId'>) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a folder." });
        return;
    }
    try {
        const folderPayload = { ...folderData, userId: user.uid };
        const newFolder = await addFolder(folderPayload);
        setFolders(prev => [...prev, newFolder]);
        if (newFolder.parentId) {
            setExpandedFolders(prev => new Set(prev).add(newFolder.parentId!));
        }
        toast({ title: "Folder Created", description: `Folder "${newFolder.name}" has been created.` });
    } catch (error: any) {
        console.error("Failed to create folder:", error);
        toast({ variant: "destructive", title: "Folder Creation Failed", description: error.message });
    }
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
  
  const handleDeleteSelected = async () => {
    const filesToDelete = files.filter(file => selectedFileIds.includes(file.id));
    if (filesToDelete.length === 0) return;

    try {
        await deleteFiles(filesToDelete);
        setFiles(prevFiles => prevFiles.filter(file => !selectedFileIds.includes(file.id)));
        toast({
            title: `${selectedFileIds.length} file(s) deleted`,
            description: 'The selected files have been removed.',
        });
        setSelectedFileIds([]);
    } catch (error: any) {
        console.error("Failed to delete files:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    }
  };

  const handleDeleteFolder = (folder: FolderItem) => {
    setFolderToDelete(folder);
  };
  
  const handleConfirmDeleteFolder = async () => {
      if (!folderToDelete || !user) return;

      try {
        await deleteFolderAndContents(user.uid, folderToDelete.id);

        const [refetchedFolders, refetchedFiles] = await Promise.all([
            getFolders(user.uid),
            getFiles(user.uid)
        ]);
        setFolders(refetchedFolders);
        setFiles(refetchedFiles);

        if (selectedFolderId === folderToDelete.id) {
            setSelectedFolderId(null);
        }

        toast({
            title: "Folder Deleted",
            description: `Folder "${folderToDelete.name}" and all its contents have been removed.`,
        });
      } catch (error: any) {
        console.error("Failed to delete folder:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
      } finally {
        setFolderToDelete(null);
      }
  };
  
  const selectedFolder = useMemo(() => folders.find(f => f.id === selectedFolderId), [folders, selectedFolderId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to upload files.'});
        return;
    }
    if (!event.target.files || event.target.files.length === 0 || !selectedFolderId) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Please select a folder and at least one file to upload.',
      });
      return;
    }

    const filesToUpload = Array.from(event.target.files);
    const formData = new FormData();
    formData.append('userId', user.uid);
    formData.append('folderId', selectedFolderId);
    filesToUpload.forEach(file => {
        formData.append('files', file);
    });

    try {
        const addedFiles = await uploadFiles(formData);
        setFiles((prev) => [...prev, ...addedFiles]);
        toast({
            title: `${addedFiles.length} file(s) uploaded successfully!`,
            description: `Added to "${selectedFolder?.name}".`,
        });
    } catch (error: any) {
        console.error("File upload failed:", error);
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    if (selectedFileIds.length === 0) return;
    setIsDownloading(true);
    try {
        for (const fileId of selectedFileIds) {
            const fileToDownload = files.find(f => f.id === fileId);
            if (!fileToDownload) continue;

            const url = await getFileDownloadUrl(fileToDownload.storagePath);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', fileToDownload.name);
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }
        toast({
            title: 'Download Started',
            description: `Your file(s) are being downloaded.`,
        });
    } catch (error) {
        console.error("Download failed:", error);
        toast({
            variant: 'destructive',
            title: 'Download Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
    } finally {
        setIsDownloading(false);
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
  
  const handleConfirmRename = async () => {
    if (!renamingFolder || !renameInputValue.trim() || renamingFolder.name === renameInputValue.trim()) {
        handleCancelRename();
        return;
    }

    const newName = renameInputValue.trim();
    try {
        await updateFolder(renamingFolder.id, { name: newName });
        setFolders(prev =>
            prev.map(f =>
                f.id === renamingFolder.id ? { ...f, name: newName } : f
            )
        );
        toast({
            title: "Folder Renamed",
            description: `"${renamingFolder.name}" was renamed to "${newName}".`,
        });
    } catch (error: any) {
        console.error("Failed to rename folder:", error);
        toast({ variant: "destructive", title: "Rename Failed", description: error.message });
    } finally {
        handleCancelRename();
    }
  };

  const handleRenameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleConfirmRename();
      } else if (e.key === 'Escape') {
          handleCancelRename();
      }
  };

  const handleFileDrop = async (file: FileItem, newFolderId: string) => {
    if (file.folderId === newFolderId) return;

    try {
        await updateFile(file.id, { folderId: newFolderId });
        setFiles((prevFiles) =>
            prevFiles.map((f) =>
                f.id === file.id ? { ...f, folderId: newFolderId } : f
            )
        );
        const folder = folders.find((f) => f.id === newFolderId);
        toast({
            title: "File Moved",
            description: `"${file.name}" was moved to "${folder?.name || 'new folder'}"`,
        });
    } catch (error: any) {
        console.error("Failed to move file:", error);
        toast({ variant: "destructive", title: "Move Failed", description: error.message });
    }
  };

  const DraggableTableRow = ({ file, children }: { file: FileItem, children: React.ReactNode }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.FILE,
        item: file,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));
    
    return (
      <TableRow
        ref={drag}
        onClick={() => setPreviewFile(file)}
        className={cn("cursor-move", isDragging && "opacity-50")}
      >
        {children}
      </TableRow>
    );
  };


  const FolderTree = ({ parentId = null, level = 0 }: { parentId?: string | null, level?: number }) => {
    const children = folders.filter(f => f.parentId === parentId);
    if (children.length === 0 && level === 0 && parentId === null) {
        // Special case for when there are no folders at all
        return <p className="p-4 text-center text-sm text-muted-foreground">No folders yet. Create one to get started.</p>;
    }
    if (children.length === 0) return null;

    return (
      <div style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
        {children.map(folder => {
          const hasChildren = folders.some(f => f.parentId === folder.id);
          const isExpanded = expandedFolders.has(folder.id);
          const isRenaming = renamingFolder?.id === folder.id;
          
          const [{ canDrop, isOver }, drop] = useDrop(() => ({
            accept: ItemTypes.FILE,
            drop: (item: FileItem) => handleFileDrop(item, folder.id),
            collect: (monitor) => ({
                isOver: monitor.isOver(),
                canDrop: monitor.canDrop(),
            }),
          }));

          return (
            <div key={folder.id} className="my-1">
              <div
                ref={drop}
                className={cn(
                  "group flex items-center gap-2 rounded-md pr-2 cursor-pointer hover:bg-accent",
                  (isOver && canDrop) && "bg-primary/20 ring-1 ring-primary"
                )}
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
                        <div className="w-6 h-6" />
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

  if (!user) {
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <p className="text-muted-foreground">Please log in to use the File Manager.</p>
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
                                <h3 className="text-lg font-semibold p-1 rounded-md">
                                    {selectedFolder?.name || 'Select a folder'}
                                </h3>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedFileIds.length > 0 ? (
                                <>
                                    <Button
                                      onClick={handleDownload}
                                      disabled={isDownloading}
                                    >
                                      {isDownloading ? (
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                      )}
                                      Download
                                    </Button>
                                    <Button variant="destructive" onClick={handleDeleteSelected}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </>
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
                                            <DraggableTableRow key={file.id} file={file}>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
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
                                            </DraggableTableRow>
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
                            <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
                                <FolderSearch className="h-16 w-16 text-primary/30" strokeWidth={1.5} />
                                <h3 className="text-xl font-semibold text-foreground">Select a Folder</h3>
                                <p className="text-muted-foreground">
                                Choose a folder from the list on the left to view its contents.
                                </p>
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

      {previewFile && (
        <FilePreviewDialog
            isOpen={!!previewFile}
            onOpenChange={(open) => !open && setPreviewFile(null)}
            file={previewFile}
        />
      )}
    </>
  );
}

export function FilesView() {
  return (
    <DndProvider backend={HTML5Backend}>
      <FilesViewContent />
    </DndProvider>
  );
}
