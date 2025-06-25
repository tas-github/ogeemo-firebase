"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type FolderItem } from "@/data/files";
import { Folder, FolderPlus } from "lucide-react";

interface UploadFolderSelectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  folders: FolderItem[];
  onSelectFolder: (folderId: string) => void;
  onNewFolderClick: (parentId: string | null) => void;
}

export default function UploadFolderSelectDialog({
  isOpen,
  onOpenChange,
  folders,
  onSelectFolder,
  onNewFolderClick,
}: UploadFolderSelectDialogProps) {
  // ID of the folder selected in the left panel to show its children
  const [selectedParentFolderId, setSelectedParentFolderId] = useState<string | null>(null);
  // ID of the final destination folder (can be parent or child)
  const [destinationFolderId, setDestinationFolderId] = useState<string | null>(null);

  const handleContinue = () => {
    if (destinationFolderId) {
      onSelectFolder(destinationFolderId);
    }
  };

  const topLevelFolders = useMemo(() => folders.filter(f => !f.parentId), [folders]);
  const subfolders = useMemo(() => {
    if (!selectedParentFolderId) return [];
    return folders.filter(f => f.parentId === selectedParentFolderId);
  }, [folders, selectedParentFolderId]);

  const handleSelectParentFolder = (folderId: string) => {
    setSelectedParentFolderId(folderId);
    setDestinationFolderId(folderId); // A parent folder can also be the destination
  };

  const handleSelectSubfolder = (folderId: string) => {
    setDestinationFolderId(folderId);
  };
  
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return null;
    return folders.find(f => f.id === folderId)?.name;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
        <div className="p-6 pb-4 border-b text-center">
            <DialogTitle className="text-3xl font-bold font-headline text-primary">
                Select Destination Folder
            </DialogTitle>
            <DialogDescription>
                Choose where you want to upload your files.
            </DialogDescription>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-border overflow-hidden">
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
                                    onClick={() => handleSelectParentFolder(folder.id)}
                                >
                                    <Folder className="h-4 w-4" />
                                    <span>{folder.name}</span>
                                </Button>
                            ))
                        ) : (
                             <div className="flex items-center justify-center h-full text-muted-foreground p-4">
                                No top-level folders exist.
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
                                    variant={destinationFolderId === folder.id ? "secondary" : "ghost"}
                                    className="w-full justify-start gap-2"
                                    onClick={() => handleSelectSubfolder(folder.id)}
                                >
                                    <Folder className="h-4 w-4" />
                                    <span>{folder.name}</span>
                                </Button>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground p-4">
                                {selectedParentFolderId ? 'No subfolders here.' : 'Select a folder to see its subfolders.'}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t flex-col sm:flex-row items-center sm:justify-between">
          <div className="text-sm text-muted-foreground mr-auto self-center pb-4 sm:pb-0">
              {destinationFolderId ? (
                  <>
                      Selected: <span className="font-semibold text-foreground">{getFolderName(destinationFolderId)}</span>
                  </>
              ) : (
                  <span>No folder selected</span>
              )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => onNewFolderClick(selectedParentFolderId)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Folder
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="ghost" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button className="w-full sm:w-auto" onClick={handleContinue} disabled={!destinationFolderId}>
                    Continue
                </Button>
              </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
