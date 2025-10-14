'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  File as FileIconLucide,
  LoaderCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type FileItem, type FolderItem } from '@/data/files';
import { useToast } from '@/hooks/use-toast';
import { getFolders, getFiles } from '@/services/file-service';
import { fetchFileContent } from '@/app/actions/file-actions';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

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

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 space-y-4">
      <header className="text-center relative">
        <h1 className="text-3xl font-bold font-headline text-primary">
          File Cabinet
        </h1>
        <p className="text-muted-foreground">Browse your files and folders.</p>
        <div className="absolute top-0 right-0">
          <Button>View file</Button>
        </div>
      </header>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {/* Column 1: Folders */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Folders</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="space-y-1">
              {folders.map((folder) => (
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
  );
}