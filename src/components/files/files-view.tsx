
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { type FolderItem, type FileItem, mockFolders, mockFiles } from '@/data/files';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileIcon } from './file-icon';
import { format } from 'date-fns';

const NewFolderDialog = dynamic(() => import('@/components/files/new-folder-dialog'), {
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});

const UploadFolderSelectDialog = dynamic(() => import('@/components/files/upload-folder-select-dialog'), {
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
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  
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
        setSelectedFolderId(loadedFolders[0].id);
        setExpandedFolders(new Set([loadedFolders[0].id]));
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
  
  const openNewFolderDialog = (options: { parentId?: string | null } = {}) => {
    const { parentId = null } = options;
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
    setSelectedFolderId(folderId);
    setSelectedFileIds([]);
  };

  const toggleFolder = (folderId: string) => {
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
  
  const selectedFolder = useMemo(() => folders.find(f => f.id === selectedFolderId), [folders, selectedFolderId]);

  const FolderTree = ({ parentId = null }: { parentId?: string | null }) => {
    const children = folders.filter(f => f.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className={parentId !== null ? 'pl-4' : ''}>
        {children.map(folder => {
          const hasChildren = folders.some(f => f.parentId === folder.id);
          return (
            <div key={folder.id}>
              <div
                className="group flex items-center gap-2 rounded-md hover:bg-accent"
                >
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4 text-primary transition-transform" style={{ transform: expandedFolders.has(folder.id) ? 'rotate(90deg)' : '' }} />
                  </Button>
                ) : (
                  <Folder className="h-4 w-4 text-primary ml-4" />
                )}
                <Button
                  variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start h-8"
                  onClick={() => handleSelectFolder(folder.id)}
                >
                  <span>{folder.name}</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openNewFolderDialog({ parentId: folder.id })}>
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Add subfolder
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {expandedFolders.has(folder.id) && <FolderTree parentId={folder.id} />}
            </div>
          );
        })}
      </div>
    );
  };

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
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
      <div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Ogeemo File Manager
          </h1>
          <p className="text-muted-foreground">
            A new foundation for managing your files and folders.
          </p>
        </header>

        <div className="flex-1 grid grid-cols-[300px_1fr] gap-px bg-border border rounded-lg overflow-hidden">
            <div className="flex flex-col bg-background">
                <h3 className="p-4 text-lg font-semibold border-b">Folders</h3>
                <ScrollArea className="flex-1 p-2">
                    <FolderTree />
                </ScrollArea>
                <div className="p-2 border-t">
                    <Button variant="outline" className="w-full" onClick={() => openNewFolderDialog()}>
                        <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                    </Button>
                </div>
            </div>

            <div className="flex flex-col bg-background">
                <div className="flex items-center justify-between p-4 border-b h-[65px]">
                    {selectedFileIds.length > 0 ? (
                        <>
                            <h3 className="text-lg font-semibold">{selectedFileIds.length} selected</h3>
                            <Button variant="destructive" onClick={handleDeleteSelected}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-semibold">{selectedFolder?.name || 'Select a folder'}</h3>
                            <Button variant="outline" onClick={handleUploadClick} disabled={!selectedFolderId}>
                                <FileUp className="mr-2 h-4 w-4" /> Upload
                            </Button>
                        </>
                    )}
                </div>
                <ScrollArea className="flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedFileIds.length > 0 && selectedFileIds.length === filesInSelectedFolder.length}
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
                </ScrollArea>
            </div>
        </div>
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

      {isUploadDialogOpen && (
        <UploadFolderSelectDialog
            isOpen={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
            folders={folders}
            onSelectFolder={(folderId) => {
                console.log("Would upload to folder:", folderId);
                fileInputRef.current?.click();
                setIsUploadDialogOpen(false);
            }}
            onNewFolderClick={(parentId) => {
                setIsUploadDialogOpen(false);
                openNewFolderDialog({ parentId });
            }}
        />
      )}
    </>
  );
}
