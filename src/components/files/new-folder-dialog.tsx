
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setNewFolderName("");
      setSelectedParentId(initialParentId);
    }
  }, [isOpen, initialParentId]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({ variant: "destructive", title: "Folder Name Required" });
      return;
    }
    onFolderCreated({ 
        name: newFolderName.trim(), 
        parentId: selectedParentId 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialParentId ? 'Create New Subfolder' : 'Create New Folder'}</DialogTitle>
          <DialogDescription>
            Enter a name for your new folder.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent-folder">Parent Folder</Label>
            <Select 
                value={selectedParentId || 'root'} 
                onValueChange={(value) => setSelectedParentId(value === 'root' ? null : value)}
            >
              <SelectTrigger id="parent-folder">
                <SelectValue placeholder="Select a parent folder..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={'root'}>
                  (Root Folder)
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-name">Name</Label>
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
