
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
  allFolders,
  parentId = null,
  level = 0,
}: {
  allFolders: FolderItem[];
  parentId?: string | null;
  level?: number;
}) => {
  const childFolders = allFolders.filter((f) => f.parentId === parentId);

  if (childFolders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {childFolders.map((folder) => (
        <div key={folder.id} style={{ paddingLeft: `${level * 1.5}rem` }}>
          <div className="flex items-center space-x-3 rounded-md p-2 hover:bg-accent has-[:checked]:bg-accent">
            <RadioGroupItem value={folder.id} id={folder.id} />
            <Label
              htmlFor={folder.id}
              className="flex-1 cursor-pointer flex items-center gap-2"
            >
              <Folder className="h-4 w-4" />
              {folder.name}
            </Label>
          </div>
          <FolderRadioList
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

  const handleContinue = () => {
    if (selectedFolderId) {
      onSelectFolder(selectedFolderId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Select Destination Folder</DialogTitle>
          <DialogDescription>
            Choose the folder where you want to upload your files.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-hidden">
          <RadioGroup
            value={selectedFolderId}
            onValueChange={setSelectedFolderId}
            className="h-full"
          >
            <ScrollArea className="h-full border rounded-md p-2">
              {folders.length > 0 ? (
                <FolderRadioList allFolders={folders} parentId={null} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No folders have been created yet.
                </div>
              )}
            </ScrollArea>
          </RadioGroup>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
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
