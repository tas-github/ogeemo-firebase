
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type FolderItem } from "@/data/files";
import { Folder } from "lucide-react";

interface UploadFolderSelectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  folders: FolderItem[];
  onSelectFolder: (folderId: string) => void;
}

const FolderRadioList = ({
  folders,
  allFolders,
  parentId = null,
  level = 0,
}: {
  folders: FolderItem[];
  allFolders: FolderItem[];
  parentId?: string | null;
  level?: number;
}) => {
  const childFolders = folders.filter((f) => f.parentId === parentId);
  if (childFolders.length === 0 && level === 0) {
      return null;
  }
  return (
    <div className="space-y-2">
      {childFolders.map((folder) => (
        <div key={folder.id} style={{ paddingLeft: `${level * 1.5}rem` }}>
          <div className="flex items-center space-x-3 rounded-md p-2 hover:bg-accent has-[:checked]:bg-accent">
            <RadioGroupItem value={folder.id} id={folder.id} />
            <Label htmlFor={folder.id} className="flex-1 cursor-pointer flex items-center gap-2">
              <Folder className="h-4 w-4" />
              {folder.name}
            </Label>
          </div>
          <FolderRadioList
            folders={allFolders}
            allFolders={allFolders}
            parentId={folder.id}
            level={level + 1}
          />
        </div>
      ))}
    </div>
  );
};

export default function UploadFolderSelectDialog({
  isOpen,
  onOpenChange,
  folders,
  onSelectFolder,
}: UploadFolderSelectDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const topLevelFolders = folders.filter(f => !f.parentId);

  const handleContinue = () => {
    if (selectedFolderId) {
      onSelectFolder(selectedFolderId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Destination Folder</DialogTitle>
          <DialogDescription>
            Choose the folder where you want to upload your files.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={selectedFolderId} onValueChange={setSelectedFolderId}>
            <ScrollArea className="h-64 border rounded-md p-2">
                {topLevelFolders.length > 0 ? (
                    <FolderRadioList folders={topLevelFolders} allFolders={folders} />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No folders have been created yet.
                    </div>
                )}
            </ScrollArea>
        </RadioGroup>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!selectedFolderId}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
