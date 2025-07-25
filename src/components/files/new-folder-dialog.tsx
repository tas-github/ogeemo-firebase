
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type FolderItem } from "@/data/files";

interface NewFolderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFolderCreated: (newFolderData: Omit<FolderItem, 'id'>) => void;
  folders: FolderItem[];
  initialParentId?: string | null;
}

export default function NewFolderDialog({
  isOpen,
  onOpenChange,
  onFolderCreated,
  folders,
  initialParentId = null,
}: NewFolderDialogProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();
  
  const parentFolder = folders.find(f => f.id === initialParentId);

  useEffect(() => {
    if (isOpen) {
      setNewFolderName("");
    }
  }, [isOpen]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({ variant: "destructive", title: "Folder Name Required" });
      return;
    }
    onFolderCreated({ 
        name: newFolderName.trim(), 
        parentId: initialParentId 
    });
    onOpenChange(false);
  };

  const dialogTitle = initialParentId ? 'Create New Subfolder' : 'Create New Folder';
  const dialogDescription = initialParentId 
    ? `This will create a new folder inside "${parentFolder?.name || 'the selected folder'}".`
    : 'Enter a name for your new top-level folder.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {initialParentId && parentFolder && (
            <div className="space-y-2">
              <Label>Parent Folder</Label>
              <Input value={parentFolder.name} readOnly disabled />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="folder-name">New Folder Name</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g., 'Client Reports'"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateFolder();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
