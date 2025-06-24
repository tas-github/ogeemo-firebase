
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Folder,
  MoreVertical,
  Trash2,
  Upload,
  Download,
  FolderPlus,
  Pencil,
  Archive,
  Move,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { type FileItem, type FolderItem, mockFiles, mockFolders } from '@/data/files';
import { useToast } from '@/hooks/use-toast';
import { FileIcon } from '@/components/files/file-icon';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | null>(null);
  const [newFolderNameInDialog, setNewFolderNameInDialog] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    let loadedFolders = mockFolders;
    let loadedFiles = mockFiles;
    try {
      const storedFolders = localStorage.getItem('fileFolders');
      const storedFiles = localStorage.getItem('files');

      if (storedFolders) loadedFolders = JSON.parse(storedFolders);
      if (storedFiles) {
        loadedFiles = JSON.parse(storedFiles).map((f: FileItem) => ({
          ...f,
          modifiedAt: new Date(f.modifiedAt),
        }));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage, using mock data.", error);
    } finally {
      setFolders(loadedFolders);
      setFiles(loadedFiles);
      setSelectedFolderId(loadedFolders[0]?.id || null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('fileFolders', JSON.stringify(folders));
      } catch (error) {
        console.error("Failed to save folders to localStorage", error);
      }
    }
  }, [folders, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('files', JSON.stringify(files));
      } catch (error) {
        console.error("Failed to save files to localStorage", error);
      }
    }
  }, [files, isLoading]);
  
  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId),
    [folders, selectedFolderId]
  );
  
  const displayedFiles = useMemo(
    () => files.filter((f) => f.folderId === selectedFolderId),
    [files, selectedFolderId]
  );

  const allVisibleFilesSelected = displayedFiles.length > 0 && selectedFileIds.length === displayedFiles.length;
  const someVisibleFilesSelected = selectedFileIds.length > 0 && selectedFileIds.length < displayedFiles.length;

  const handleToggleFileSelect = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleToggleSelectAllFiles = () => {
    if (allVisibleFilesSelected) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(displayedFiles.map(f => f.id));
    }
  };

  const handleToggleFolderSelect = (folderId: string) => {
    setSelectedFolderIds(prev => prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]);
  };
  
  const handleSelectAllFolders = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedFolderIds(folders.map(f => f.id));
    } else {
      setSelectedFolderIds([]);
    }
  };

  const allFoldersSelected = folders.length > 0 && selectedFolderIds.length === folders.length;
  const someFoldersSelected = selectedFolderIds.length > 0 && selectedFolderIds.length < folders.length;

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: FolderItem = {
        id: `f-${Date.now()}`,
        name: newFolderName.trim(),
      };
      setFolders([...folders, newFolder]);
      setNewFolderName("");
      setIsNewFolderDialogOpen(false);
      setSelectedFolderId(newFolder.id);
    }
  };

  const handleDeleteFiles = (fileIds: string[]) => {
    setFiles(files.filter(f => !fileIds.includes(f.id)));
    setSelectedFileIds(prev => prev.filter(id => !fileIds.includes(id)));
    toast({ title: `${fileIds.length} File(s) Deleted`, description: `The selected files have been removed.` });
  };
  
  const handleBulkDeleteFolders = () => {
    // Prevent deleting the currently viewed folder without resetting view
    if (selectedFolderId && selectedFolderIds.includes(selectedFolderId)) {
        setSelectedFolderId(folders.find(f => !selectedFolderIds.includes(f.id))?.id || null);
    }
    setFolders(prev => prev.filter(f => !selectedFolderIds.includes(f.id)));
    setFiles(prev => prev.filter(file => !selectedFolderIds.includes(file.folderId)));
    toast({ title: `${selectedFolderIds.length} Folder(s) Deleted`, description: "The selected folders and their contents have been removed." });
    setSelectedFolderIds([]);
  };

  const handleBulkArchiveFiles = () => {
    let archiveFolder = folders.find(f => f.name.toLowerCase() === 'archive');
    if (!archiveFolder) {
      archiveFolder = { id: 'folder-archive', name: 'Archive' };
      setFolders(prev => [...prev, archiveFolder!]);
    }
    const archiveFolderId = archiveFolder.id;

    setFiles(prevFiles => 
      prevFiles.map(file => 
        selectedFileIds.includes(file.id) ? { ...file, folderId: archiveFolderId } : file
      )
    );
    
    toast({
      title: 'Files Archived',
      description: `${selectedFileIds.length} file(s) have been moved to the Archive folder.`,
    });
    setSelectedFileIds([]);
  };


  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
  };

  const handleCreateFolderInDialog = () => {
      if (newFolderNameInDialog.trim()) {
          const newFolder: FolderItem = {
              id: `f-${Date.now()}`,
              name: newFolderNameInDialog.trim(),
          };
          setFolders(prev => [...prev, newFolder]);
          setUploadTargetFolderId(newFolder.id);
          setNewFolderNameInDialog("");
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && uploadTargetFolderId) {
      const targetFolder = folders.find(f => f.id === uploadTargetFolderId);
      const newFiles: FileItem[] = Array.from(e.target.files).map(file => ({
        id: `file-${Date.now()}-${file.name}`,
        name: file.name,
        type: file.type || 'unknown',
        size: file.size,
        modifiedAt: new Date(),
        folderId: uploadTargetFolderId,
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Upload Successful",
        description: `${newFiles.length} file(s) have been added to "${targetFolder?.name}".`
      });
      e.target.value = '';

      setIsUploadDialogOpen(false);
      setSelectedFolderId(uploadTargetFolderId);
      setUploadTargetFolderId(null);
      setNewFolderNameInDialog("");
    }
  };

  const handleMoveFile = (fileId: string, targetFolderId: string) => {
    const fileToMove = files.find(f => f.id === fileId);
    const targetFolder = folders.find(f => f.id === targetFolderId);

    if (fileToMove && targetFolder) {
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === fileId ? { ...f, folderId: targetFolderId } : f
        )
      );
      toast({
        title: "File Moved",
        description: `"${fileToMove.name}" has been moved to the "${targetFolder.name}" folder.`,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  const handleFolderRowClick = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderIds([]);
  };

  return (
    <>
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        setIsUploadDialogOpen(open);
        if (!open) {
            setUploadTargetFolderId(null);
            setNewFolderNameInDialog("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              First, select or create a folder to upload your files into.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label className="font-semibold">Select an existing folder</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
                <RadioGroup onValueChange={setUploadTargetFolderId} value={uploadTargetFolderId ?? ""}>
                    {folders.map(folder => (
                        <div key={folder.id} className="flex items-center space-x-2 py-1">
                            <RadioGroupItem value={folder.id} id={`r-${folder.id}`} />
                            <Label htmlFor={`r-${folder.id}`} className="font-normal cursor-pointer flex-1">{folder.name}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </ScrollArea>

            <Separator />

            <div>
                <Label htmlFor="new-folder-dialog-input" className="font-semibold">Or create a new one</Label>
                <div className="flex items-center space-x-2 mt-2">
                    <Input
                        id="new-folder-dialog-input"
                        placeholder="New folder name..."
                        value={newFolderNameInDialog}
                        onChange={(e) => setNewFolderNameInDialog(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateFolderInDialog(); }}}
                    />
                    <Button type="button" onClick={handleCreateFolderInDialog} disabled={!newFolderNameInDialog.trim()}>
                      Create
                    </Button>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={!uploadTargetFolderId}>
              Upload File Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col h-full">
        <header className="text-center py-4 sm:py-6 px-4 sm:px-6">
          <h1 className="text-3xl font-bold font-headline text-primary">File Manager</h1>
          <p className="text-muted-foreground">Store, organize, and share your documents.</p>
        </header>
        <div className="flex-1 min-h-0 pb-4 sm:pb-6">
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="flex h-full flex-col p-2">
                <div className="p-2 border-b">
                   {selectedFolderIds.length > 0 ? (
                    <div className="flex items-center justify-between h-[40px]">
                      <span className="text-sm font-medium">{selectedFolderIds.length} selected</span>
                      <Button size="sm" variant="destructive" onClick={handleBulkDeleteFolders}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  ) : (
                    <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Create New Folder</DialogTitle>
                          <DialogDescription>Enter a name for your new folder.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="folder-name" className="sr-only">Name</Label>
                          <Input
                            id="folder-name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="e.g., 'Project Reports'"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateFolder(); }}}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleCreateFolder}>Create</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="flex items-center gap-3 p-2 border-b">
                  <Checkbox 
                    id="select-all-folders"
                    checked={allFoldersSelected ? true : someFoldersSelected ? 'indeterminate' : false}
                    onCheckedChange={handleSelectAllFolders}
                  />
                  <Label htmlFor="select-all-folders" className="text-sm font-medium">Folder Name</Label>
                </div>
                <ScrollArea className="flex-1">
                  <nav className="flex flex-col gap-1 p-2">
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        className={cn(
                          "flex items-center gap-3 rounded-md pr-2 transition-colors",
                          selectedFolderId === folder.id && selectedFolderIds.length === 0 && "bg-secondary"
                        )}
                      >
                        <Checkbox 
                          id={`select-${folder.id}`}
                          className="ml-2"
                          checked={selectedFolderIds.includes(folder.id)}
                          onCheckedChange={() => handleToggleFolderSelect(folder.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          onClick={() => handleFolderRowClick(folder.id)}
                          className="flex-1 flex items-center gap-3 h-9 px-2 cursor-pointer hover:bg-accent rounded-md"
                        >
                          <Folder className="h-4 w-4" />
                          <span className="flex-1 truncate">{folder.name}</span>
                        </div>
                      </div>
                    ))}
                  </nav>
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
                {selectedFolderIds.length > 0 ? (
                   <div className="h-full flex items-center justify-center text-muted-foreground">
                        <p>{selectedFolderIds.length} folders selected. Clear selection to view files.</p>
                   </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b h-20">
                      {selectedFileIds.length > 0 ? (
                        <>
                          <h2 className="text-xl font-bold">{selectedFileIds.length} selected</h2>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleBulkArchiveFiles}>
                              <Archive className="mr-2 h-4 w-4" /> Archive
                            </Button>
                            <Button variant="destructive" onClick={() => handleDeleteFiles(selectedFileIds)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h2 className="text-xl font-bold">{selectedFolder?.name || "Select a folder"}</h2>
                            <p className="text-sm text-muted-foreground">
                              {selectedFolder ? `${displayedFiles.length} item(s)` : 'No folder selected'}
                            </p>
                          </div>
                          <Button onClick={handleUploadClick}>
                            <Upload className="mr-2 h-4 w-4" /> Upload File
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox
                                checked={allVisibleFilesSelected ? true : someVisibleFilesSelected ? 'indeterminate' : false}
                                onCheckedChange={handleToggleSelectAllFiles}
                                aria-label="Select all"
                                disabled={displayedFiles.length === 0}
                              />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Date Modified</TableHead>
                            <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedFiles.length > 0 ? (
                                displayedFiles.map((file) => (
                                    <TableRow key={file.id}>
                                    <TableCell>
                                        <Checkbox
                                        checked={selectedFileIds.includes(file.id)}
                                        onCheckedChange={() => handleToggleFileSelect(file.id)}
                                        aria-label={`Select ${file.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <FileIcon fileType={file.type} />
                                            <span>{file.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatFileSize(file.size)}</TableCell>
                                    <TableCell>{format(file.modifiedAt, 'PPp')}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Download</DropdownMenuItem>
                                                <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <Move className="mr-2 h-4 w-4" />
                                                        <span>Move to Folder</span>
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent>
                                                            {folders.filter(folder => folder.id !== file.folderId).length > 0 ? (
                                                                folders.filter(folder => folder.id !== file.folderId).map(targetFolder => (
                                                                    <DropdownMenuItem key={targetFolder.id} onSelect={() => handleMoveFile(file.id, targetFolder.id)}>
                                                                        <Folder className="mr-2 h-4 w-4" />
                                                                        <span>{targetFolder.name}</span>
                                                                    </DropdownMenuItem>
                                                                ))
                                                            ) : (
                                                                <DropdownMenuItem disabled>No other folders</DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteFiles([file.id])}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        {selectedFolderId ? "This folder is empty." : "Please select a folder to view its files."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  );
}
