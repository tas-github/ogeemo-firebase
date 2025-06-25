
"use client";

import React, { useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Archive,
  Search,
  UploadCloud,
  FilePenLine,
  Move,
  FolderPlus,
  LoaderCircle,
} from 'lucide-react';
import { format } from "date-fns";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { FileIcon } from '@/components/files/file-icon';
import { type FileItem, type FolderItem, mockFiles, mockFolders } from '@/data/files';
import { ScrollArea } from '@/components/ui/scroll-area';

const NewFolderDialog = dynamic(() => import('@/components/files/new-folder-dialog'), {
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});

const UploadFolderSelectDialog = dynamic(() => import('@/components/files/upload-folder-select-dialog'), {
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});


export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>(mockFolders);
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('folder-1'); 
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderInitialParentId, setNewFolderInitialParentId] = useState<string | null>(null);
  const [isFolderSelectOpen, setIsFolderSelectOpen] = useState(false);
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string | null>(null);


  const topLevelFolders = useMemo(() => folders.filter(f => !f.parentId), [folders]);
  const subfoldersByParentId = useMemo(() => {
    const map = new Map<string, FolderItem[]>();
    folders.forEach(folder => {
      if (folder.parentId) {
        if (!map.has(folder.parentId)) {
          map.set(folder.parentId, []);
        }
        map.get(folder.parentId)!.push(folder);
      }
    });
    return map;
  }, [folders]);

  const displayedFiles = useMemo(() => {
    return files
      .filter(file => file.folderId === selectedFolderId)
      .filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, selectedFolderId, searchQuery]);

  const handleToggleSelectFile = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };
  
  const allVisibleSelected = displayedFiles.length > 0 && selectedFileIds.length === displayedFiles.length;
  const someVisibleSelected = selectedFileIds.length > 0 && selectedFileIds.length < displayedFiles.length;

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(displayedFiles.map(f => f.id));
    }
  };
  
  const handleDeleteSelected = () => {
    setFiles(files.filter(f => !selectedFileIds.includes(f.id)));
    toast({ title: `${selectedFileIds.length} file(s) deleted.` });
    setSelectedFileIds([]);
  };
  
  const handleArchiveSelected = () => {
    toast({ title: `${selectedFileIds.length} file(s) archived.` });
    setSelectedFileIds([]);
  };

  const handleUploadClick = () => {
    if (folders.length === 0) {
      toast({
        variant: "destructive",
        title: "No Folders Available",
        description: "Please create a folder before uploading files.",
      });
      return;
    }
    setIsFolderSelectOpen(true);
  };

  const handleFolderSelectedForUpload = (folderId: string) => {
    setUploadTargetFolder(folderId);
    setIsFolderSelectOpen(false);
    // Use a timeout to ensure state update completes before triggering the file input click
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && uploadTargetFolder) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        modifiedAt: new Date(),
        folderId: uploadTargetFolder,
      }));
      setFiles(prev => [...prev, ...newFiles]);
      toast({ title: `${newFiles.length} file(s) uploaded.` });
      setUploadTargetFolder(null); // Reset after upload
    }
    e.target.value = '';
  };
  
  const openNewFolderDialog = (options: { parentId?: string | null } = {}) => {
    const { parentId = null } = options;
    setNewFolderInitialParentId(parentId);
    setIsNewFolderDialogOpen(true);
  };

  const handleCreateFolder = (newFolder: FolderItem) => {
    setFolders(prev => [...prev, newFolder]);
    toast({ title: "Folder Created" });
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedFileIds([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentFolderName = folders.find(f => f.id === selectedFolderId)?.name || 'Files';

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
      <div className="flex flex-col h-full">
        <header className="text-center py-4 sm:py-6 px-4 sm:px-6">
          <h1 className="text-3xl font-bold font-headline text-primary">File Manager</h1>
          <p className="text-muted-foreground">Store, organize, and share your documents.</p>
        </header>
        <div className="flex-1 min-h-0 pb-4 sm:pb-6 px-4 sm:px-6">
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="flex h-full flex-col p-2">
                <div className="p-2">
                  <Button className="w-full" onClick={() => openNewFolderDialog()}>
                      <Plus className="mr-2 h-4 w-4" /> New Folder
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                    <nav className="flex flex-col gap-1 p-2">
                       {topLevelFolders.map(folder => (
                          <div key={folder.id} className="w-full">
                             <div className="w-full group/folder-item relative">
                                <Button
                                  variant={selectedFolderId === folder.id ? 'secondary' : 'ghost'}
                                  className="w-full justify-start gap-2 h-9"
                                  onClick={() => handleFolderSelect(folder.id)}
                                >
                                  <Folder className="h-4 w-4" />
                                  <span className="truncate">{folder.name}</span>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover/folder-item:opacity-100 focus-within:opacity-100">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => openNewFolderDialog({ parentId: folder.id })}>
                                      <FolderPlus className="mr-2 h-4 w-4" />
                                      <span>Add Subfolder</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            <div className="pl-4">
                              {subfoldersByParentId.get(folder.id)?.map(subFolder => (
                                <Button
                                  key={subFolder.id}
                                  variant={selectedFolderId === subFolder.id ? 'secondary' : 'ghost'}
                                  className="w-full justify-start gap-2 h-9"
                                  onClick={() => handleFolderSelect(subFolder.id)}
                                >
                                  <Folder className="h-4 w-4" />
                                  <span className="truncate">{subFolder.name}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                    </nav>
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-2 border-b h-16">
                    {selectedFileIds.length > 0 ? (
                        <>
                            <p className="text-sm font-medium px-2">{selectedFileIds.length} selected</p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleArchiveSelected}><Archive className="mr-2 h-4 w-4"/>Archive</Button>
                                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                            </div>
                        </>
                    ) : (
                        <>
                             <div className="flex-1">
                                <h2 className="text-lg font-semibold px-2">{currentFolderName}</h2>
                             </div>
                             <div className="relative max-w-sm mr-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search files..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleUploadClick}><UploadCloud className="mr-2 h-4 w-4"/>Upload File</Button>
                        </>
                    )}
                </div>
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                           <Checkbox
                                checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                                onCheckedChange={handleToggleSelectAll}
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedFiles.map(file => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <Checkbox
                                checked={selectedFileIds.includes(file.id)}
                                onCheckedChange={() => handleToggleSelectFile(file.id)}
                                aria-label={`Select ${file.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <FileIcon fileType={file.type} />
                                <span>{file.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{format(file.modifiedAt, 'PPp')}</TableCell>
                          <TableCell>{formatFileSize(file.size)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem><FilePenLine className="mr-2 h-4 w-4"/>Rename</DropdownMenuItem>
                                    <DropdownMenuItem><Move className="mr-2 h-4 w-4"/>Move to...</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {displayedFiles.length === 0 && (
                     <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No files in this folder.</p>
                     </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
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
      {isFolderSelectOpen && (
        <UploadFolderSelectDialog
          isOpen={isFolderSelectOpen}
          onOpenChange={setIsFolderSelectOpen}
          folders={folders}
          onSelectFolder={handleFolderSelectedForUpload}
        />
      )}
    </>
  );
}
