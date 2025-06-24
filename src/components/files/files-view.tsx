
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
  Search,
  ChevronRight,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | null>(null);
  const [newFolderNameInDialog, setNewFolderNameInDialog] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>(['folder-1', 'folder-4']);

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
      if (!selectedFolderId) {
        setSelectedFolderId(loadedFolders.find(f => f.parentId === null)?.id || null);
      }
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
  
  const displayedFiles = useMemo(
    () => files.filter((f) => {
        if (f.folderId !== selectedFolderId) return false;
        if (!searchQuery.trim()) return true;
        return f.name.toLowerCase().includes(searchQuery.toLowerCase());
    }),
    [files, selectedFolderId, searchQuery]
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

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: FolderItem = {
        id: `f-${Date.now()}`,
        name: newFolderName.trim(),
        parentId: selectedFolderId,
      };
      setFolders([...folders, newFolder]);
      if(selectedFolderId && !expandedFolderIds.includes(selectedFolderId)) {
        setExpandedFolderIds(prev => [...prev, selectedFolderId!]);
      }
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
  
  const handleBulkArchiveFiles = () => {
    let archiveFolder = folders.find(f => f.name.toLowerCase() === 'archive' && f.parentId === null);
    if (!archiveFolder) {
      archiveFolder = { id: 'folder-archive', name: 'Archive', parentId: null };
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
    setUploadTargetFolderId(selectedFolderId);
    setIsUploadDialogOpen(true);
  };

  const handleCreateFolderInDialog = () => {
      if (newFolderNameInDialog.trim() && uploadTargetFolderId) {
          const newFolder: FolderItem = {
              id: `f-${Date.now()}`,
              name: newFolderNameInDialog.trim(),
              parentId: uploadTargetFolderId,
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
      e.target.value = ''; // Reset file input

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
  
  const handleToggleExpand = (folderId: string) => {
    setExpandedFolderIds(prev => prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]);
  };

  const breadcrumbPath = useMemo(() => {
    if (!selectedFolderId) return [];
    const path: FolderItem[] = [];
    let currentFolder = folders.find(f => f.id === selectedFolderId);
    while (currentFolder) {
      path.unshift(currentFolder);
      currentFolder = folders.find(f => f.id === currentFolder!.parentId);
    }
    return path;
  }, [selectedFolderId, folders]);

  const renderFolderTree = (parentId: string | null, level = 0): React.ReactNode => {
    const childFolders = folders.filter(folder => folder.parentId === parentId);

    return childFolders.map(folder => {
      const hasChildren = folders.some(f => f.parentId === folder.id);
      const isExpanded = expandedFolderIds.includes(folder.id);

      return (
        <div key={folder.id} style={{ marginLeft: `${level * 1}rem` }}>
          <div
            className={cn(
              "flex items-center gap-2 rounded-md pr-2 transition-colors group",
              selectedFolderId === folder.id && "bg-secondary"
            )}
          >
            {hasChildren ? (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleExpand(folder.id)}>
                <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
              </Button>
            ) : (
              <div className="w-7" />
            )}
            <div
              onClick={() => setSelectedFolderId(folder.id)}
              className="flex-1 flex items-center gap-2 h-8 px-2 cursor-pointer hover:bg-accent rounded-md"
            >
              <Folder className="h-4 w-4" />
              <span className="flex-1 truncate">{folder.name}</span>
            </div>
          </div>
          {isExpanded && hasChildren && (
            <div className="mt-1">
              {renderFolderTree(folder.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderMoveToMenuItems = (parentId: string | null, currentFileFolderId: string): React.ReactNode[] => {
    return folders
        .filter(folder => folder.parentId === parentId)
        .map(targetFolder => {
            const children = renderMoveToMenuItems(targetFolder.id, currentFileFolderId);
            
            const item = (
                <DropdownMenuItem 
                    key={targetFolder.id} 
                    onSelect={() => handleMoveFile(selectedFileIds[0], targetFolder.id)}
                    disabled={targetFolder.id === currentFileFolderId}
                >
                    <Folder className="mr-2 h-4 w-4" />
                    <span>{targetFolder.name}</span>
                </DropdownMenuItem>
            );

            if (children.length > 0) {
                return (
                    <DropdownMenuSub key={targetFolder.id}>
                        <DropdownMenuSubTrigger disabled={targetFolder.id === currentFileFolderId}>
                            <Folder className="mr-2 h-4 w-4" />
                            <span>{targetFolder.name}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>{children}</DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                );
            }
            return item;
        });
  };

  const renderUploadFolderOptions = (parentId: string | null, level = 0): React.ReactNode => {
    return folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => (
            <React.Fragment key={folder.id}>
                <div className="flex items-center space-x-2 py-1" style={{ paddingLeft: `${level * 1.5}rem`}}>
                    <RadioGroupItem value={folder.id} id={`r-${folder.id}`} />
                    <Label htmlFor={`r-${folder.id}`} className="font-normal cursor-pointer flex-1">{folder.name}</Label>
                </div>
                {renderUploadFolderOptions(folder.id, level + 1)}
            </React.Fragment>
        ));
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
                  {renderUploadFolderOptions(null)}
                </RadioGroup>
            </ScrollArea>
            <Separator />
            <div>
                <Label htmlFor="new-folder-dialog-input" className="font-semibold">Or create a new subfolder in '{folders.find(f => f.id === uploadTargetFolderId)?.name || 'Root'}'</Label>
                <div className="flex items-center space-x-2 mt-2">
                    <Input
                        id="new-folder-dialog-input"
                        placeholder="New folder name..."
                        value={newFolderNameInDialog}
                        onChange={(e) => setNewFolderNameInDialog(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateFolderInDialog(); }}}
                        disabled={!uploadTargetFolderId}
                    />
                    <Button type="button" onClick={handleCreateFolderInDialog} disabled={!newFolderNameInDialog.trim() || !uploadTargetFolderId}>
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
                    <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Create New Folder</DialogTitle>
                          <DialogDescription>
                            Enter a name for your new folder. It will be created inside '{selectedFolderId ? folders.find(f=>f.id === selectedFolderId)?.name : 'the root'}'.
                          </DialogDescription>
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
                </div>
                <ScrollArea className="flex-1 p-2">
                  {renderFolderTree(null)}
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
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
                          <Breadcrumb>
                            <BreadcrumbList>
                              <BreadcrumbItem>
                                <BreadcrumbLink onClick={() => setSelectedFolderId(null)}>Root</BreadcrumbLink>
                              </BreadcrumbItem>
                              {breadcrumbPath.length > 0 && <BreadcrumbSeparator />}
                              {breadcrumbPath.map((folder, index) => (
                                <React.Fragment key={folder.id}>
                                  <BreadcrumbItem>
                                    {index === breadcrumbPath.length - 1 ? (
                                      <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                                    ) : (
                                      <BreadcrumbLink onClick={() => setSelectedFolderId(folder.id)}>{folder.name}</BreadcrumbLink>
                                    )}
                                  </BreadcrumbItem>
                                  {index < breadcrumbPath.length - 1 && <BreadcrumbSeparator />}
                                </React.Fragment>
                              ))}
                            </BreadcrumbList>
                          </Breadcrumb>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search this folder..."
                                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[300px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={!selectedFolderId}
                                />
                            </div>
                            <Button onClick={handleUploadClick} disabled={!selectedFolderId}>
                                <Upload className="mr-2 h-4 w-4" /> Upload File
                            </Button>
                          </div>
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
                                                {selectedFileIds.length <= 1 && (
                                                  <DropdownMenuSub>
                                                      <DropdownMenuSubTrigger>
                                                          <Move className="mr-2 h-4 w-4" />
                                                          <span>Move to Folder</span>
                                                      </DropdownMenuSubTrigger>
                                                      <DropdownMenuPortal>
                                                          <DropdownMenuSubContent>
                                                              {renderMoveToMenuItems(null, file.folderId)}
                                                          </DropdownMenuSubContent>
                                                      </DropdownMenuPortal>
                                                  </DropdownMenuSub>
                                                )}
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
                                        {selectedFolderId ? (searchQuery ? "No files match your search." : "This folder is empty.") : "Please select a folder to view its files."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  );
}
