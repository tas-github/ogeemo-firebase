
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Archive,
  Search,
  UploadCloud,
  FilePenLine,
  Move
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
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('folder-1');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Simulate loading data
    setIsLoading(true);
    setFolders(mockFolders);
    setFiles(mockFiles);
    setIsLoading(false);
  }, []);

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
    // In a real app, this would change the folderId to an 'archive' folder.
    // For now, we'll just show a toast.
    toast({ title: `${selectedFileIds.length} file(s) archived.` });
    setSelectedFileIds([]);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        modifiedAt: new Date(),
        folderId: selectedFolderId,
      }));
      setFiles(prev => [...prev, ...newFiles]);
      toast({ title: `${newFiles.length} file(s) uploaded.` });
    }
    // Reset file input
    e.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> New Folder
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                    <nav className="flex flex-col gap-1 p-2">
                        {folders.map(folder => (
                        <Button
                            key={folder.id}
                            variant={selectedFolderId === folder.id ? 'secondary' : 'ghost'}
                            className="w-full justify-start gap-3"
                            onClick={() => setSelectedFolderId(folder.id)}
                        >
                            <Folder className="h-4 w-4" />
                            <span>{folder.name}</span>
                        </Button>
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
                             <div className="relative flex-1 max-w-sm">
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
    </>
  );
}
