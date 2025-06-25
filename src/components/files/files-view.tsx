
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Folder,
  LoaderCircle,
  FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { type FolderItem, mockFolders } from '@/data/files';
import { Separator } from '@/components/ui/separator';

const NewFolderDialog = dynamic(() => import('@/components/files/new-folder-dialog'), {
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParentFolderId, setSelectedParentFolderId] = useState<string | null>(null);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderInitialParentId, setNewFolderInitialParentId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load folders from localStorage on initial render
  useEffect(() => {
    let loadedFolders = mockFolders;
    try {
      const storedFolders = localStorage.getItem('fileManagerFolders');
      if (storedFolders) {
        loadedFolders = JSON.parse(storedFolders);
      }
    } catch (error) {
      console.error("Failed to parse folders from localStorage, using mock data.", error);
    } finally {
      setFolders(loadedFolders);
      setIsLoading(false);
    }
  }, []);

  // Save folders to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('fileManagerFolders', JSON.stringify(folders));
      } catch (error) {
        console.error("Failed to save folders to localStorage", error);
      }
    }
  }, [folders, isLoading]);
  
  const openNewFolderDialog = (options: { parentId?: string | null } = {}) => {
    const { parentId = null } = options;
    setNewFolderInitialParentId(parentId);
    setIsNewFolderDialogOpen(true);
  };

  const handleCreateFolder = (newFolder: FolderItem) => {
    setFolders(prev => [...prev, newFolder]);
    toast({ title: "Folder Created", description: `Folder "${newFolder.name}" has been created.` });
  };
  
  const handleNewSubfolderClick = () => {
    if (!selectedParentFolderId) {
        toast({
            variant: 'destructive',
            title: 'No Folder Selected',
            description: 'Please select a parent folder from the left panel first.',
        });
        return;
    }
    openNewFolderDialog({ parentId: selectedParentFolderId });
  };


  const topLevelFolders = useMemo(() => folders.filter(f => !f.parentId), [folders]);
  const subfolders = useMemo(() => {
    if (!selectedParentFolderId) return [];
    return folders.filter(f => f.parentId === selectedParentFolderId);
  }, [folders, selectedParentFolderId]);
  
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

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-border border rounded-lg overflow-hidden">
            {/* Left Panel: Folders */}
            <div className="flex flex-col bg-background">
                <h3 className="p-4 text-lg font-semibold border-b">Folders</h3>
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-1">
                        {topLevelFolders.length > 0 ? (
                            topLevelFolders.map(folder => (
                                <Button
                                    key={folder.id}
                                    variant={selectedParentFolderId === folder.id ? "secondary" : "ghost"}
                                    className="w-full justify-start gap-2"
                                    onClick={() => setSelectedParentFolderId(folder.id)}
                                >
                                    <Folder className="h-4 w-4" />
                                    <span>{folder.name}</span>
                                </Button>
                            ))
                        ) : (
                             <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                                No top-level folders found. <br /> Click "+ New Folder" to begin.
                             </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Panel: Subfolders */}
            <div className="flex flex-col bg-background">
                <h3 className="p-4 text-lg font-semibold border-b">Subfolders</h3>
                <ScrollArea className="flex-1 p-2">
                     <div className="space-y-1">
                        {subfolders.length > 0 ? (
                            subfolders.map(folder => (
                                <Button
                                    key={folder.id}
                                    variant={"ghost"} // Subfolders aren't selectable in this view
                                    className="w-full justify-start gap-2 cursor-default"
                                >
                                    <Folder className="h-4 w-4" />
                                    <span>{folder.name}</span>
                                </Button>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                                {selectedParentFolderId ? 'No subfolders here.' : 'Select a folder to see its subfolders.'}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
        
        <Separator />
        
        <footer className="flex items-center justify-end gap-4">
            <Button variant="outline" onClick={() => openNewFolderDialog()}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
            </Button>
            <Button variant="outline" onClick={handleNewSubfolderClick} disabled={!selectedParentFolderId}>
                 <FolderPlus className="mr-2 h-4 w-4" />
                New Subfolder
            </Button>
        </footer>

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
