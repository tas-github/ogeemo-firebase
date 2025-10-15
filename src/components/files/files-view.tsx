
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Folder,
  File as FileIconLucide,
  LoaderCircle,
  FileText,
  FolderPlus,
  Upload,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type FileItem, type FolderItem } from '@/data/files';
import { useToast } from '@/hooks/use-toast';
import { getFolders, getFiles, addFolder, addFile } from '@/services/file-service';
import { fetchFileContent } from '@/app/actions/file-actions';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);


  const { user } = useAuth();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [fetchedFolders, fetchedFiles] = await Promise.all([
        getFolders(user.uid),
        getFiles(user.uid),
      ]);
      setFolders(fetchedFolders);
      setFiles(fetchedFiles);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load data',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedFileId(null);
    setPreviewContent(null);
  };

  const handleSelectFile = async (file: FileItem) => {
    setSelectedFileId(file.id);
    setIsPreviewLoading(true);
    setPreviewContent(null);
    try {
      if (file.storagePath) {
        const { content, error } = await fetchFileContent(file.storagePath);
        if (error) throw new Error(error);
        setPreviewContent(content || 'No text content to display.');
      } else {
        setPreviewContent('This file does not have any content to preview.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load preview',
        description: error.message,
      });
      setPreviewContent('Error loading preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const filesInSelectedFolder = React.useMemo(() => {
    if (!selectedFolderId) return [];
    return files.filter((file) => file.folderId === selectedFolderId);
  }, [files, selectedFolderId]);

  const selectedFile = React.useMemo(() => {
      if (!selectedFileId) return null;
      return files.find(f => f.id === selectedFileId);
  }, [files, selectedFileId]);

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    try {
      await addFolder({ name: newFolderName, userId: user.uid, parentId: null, createdAt: new Date() });
      await loadData(); // Reload all data to show the new folder
      toast({ title: 'Folder Created' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to create folder', description: e.message });
    } finally {
      setIsNewFolderDialogOpen(false);
      setNewFolderName('');
    }
  };
  
  const handleUploadFile = async () => {
    if (!user || !fileToUpload || !selectedFolderId) {
        toast({ variant: 'destructive', title: 'Upload Error', description: 'Please select a folder and a file to upload.' });
        return;
    }
    
    setIsUploading(true);
    try {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('userId', user.uid);
        formData.append('folderId', selectedFolderId);
        
        await addFile(formData);
        
        toast({ title: 'File Uploaded', description: `"${fileToUpload.name}" has been uploaded successfully.` });
        await loadData();
        setIsUploadDialogOpen(false);
        setFileToUpload(null);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
        setIsUploading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full p-4 sm:p-6 space-y-4">
        <header className="text-center relative">
          <h1 className="text-3xl font-bold font-headline text-primary">
            File Cabinet
          </h1>
          <p className="text-muted-foreground">Browse your files and folders.</p>
          <div className="absolute top-0 right-0 flex gap-2">
             <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)} disabled={!selectedFolderId}>
                <Upload className="mr-2 h-4 w-4" /> Upload File
             </Button>
             <Button asChild variant="outline">
                <Link href="/file-cabinet/manage">
                    <Settings className="mr-2 h-4 w-4" /> Manage Files
                </Link>
             </Button>
          </div>
        </header>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
          {/* Column 1: Folders */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Folders</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setIsNewFolderDialogOpen(true)}>
                <FolderPlus className="h-5 w-5" />
              </Button>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent className="space-y-1">
                {folders.filter(f => !f.parentId).map((folder) => ( // Only show root folders for now
                  <Button
                    key={folder.id}
                    variant={selectedFolderId === folder.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                    onClick={() => handleSelectFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4" />
                    <span className="truncate">{folder.name}</span>
                  </Button>
                ))}
              </CardContent>
            </ScrollArea>
          </Card>

          {/* Column 2: Files */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Files</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent className="space-y-1">
                {selectedFolderId ? (
                  filesInSelectedFolder.length > 0 ? (
                    filesInSelectedFolder.map((file) => (
                      <Button
                        key={file.id}
                        variant={selectedFileId === file.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-2"
                        onClick={() => handleSelectFile(file)}
                      >
                        <FileIconLucide className="h-4 w-4" />
                        <span className="truncate">{file.name}</span>
                      </Button>
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground p-4">
                      This folder is empty.
                    </div>
                  )
                ) : (
                  <div className="text-center text-sm text-muted-foreground p-4">
                    Select a folder to see its files.
                  </div>
                )}
              </CardContent>
            </ScrollArea>
          </Card>

          {/* Column 3: Preview */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent>
                {isPreviewLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <LoaderCircle className="h-6 w-6 animate-spin" />
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          <h3 className="font-semibold text-lg">{selectedFile.name}</h3>
                      </div>
                      <div className="text-xs text-muted-foreground">
                          <p><strong>Type:</strong> {selectedFile.type}</p>
                          <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                          <p><strong>Modified:</strong> {format(new Date(selectedFile.modifiedAt), 'PPp')}</p>
                      </div>
                      <pre className="mt-4 p-4 bg-muted rounded-md text-sm whitespace-pre-wrap font-sans overflow-auto">
                          <code>{previewContent}</code>
                      </pre>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground p-4">
                    Select a file to preview its content.
                  </div>
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      </div>

      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-folder-name">Folder Name</Label>
            <Input 
              id="new-folder-name" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => { setIsUploadDialogOpen(open); setFileToUpload(null); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Upload File</DialogTitle>
                  <DialogDescription>
                    Select a file to upload to the "{folders.find(f => f.id === selectedFolderId)?.name}" folder.
                  </DialogDescription>
              </DialogHeader>
              <div 
                  className="p-10 border-2 border-dashed rounded-md text-center cursor-pointer hover:border-primary"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setFileToUpload(e.dataTransfer.files[0]);
                      }
                  }}
              >
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden"
                      onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                              setFileToUpload(e.target.files[0]);
                          }
                      }}
                  />
                  {fileToUpload ? (
                    <p>Selected: {fileToUpload.name}</p>
                  ) : (
                    <p>Drag & drop a file here, or click to select a file.</p>
                  )}
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => { setIsUploadDialogOpen(false); setFileToUpload(null); }}>Cancel</Button>
                  <Button onClick={handleUploadFile} disabled={!fileToUpload || isUploading}>
                      {isUploading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                      Upload
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
