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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  onFolderCreated: (newFolder: FolderItem) => void;
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
  const [newFolderType, setNewFolderType] = useState<'folder' | 'subfolder'>('folder');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const topLevelFolders = folders.filter(f => !f.parentId);

  useEffect(() => {
    if (isOpen) {
      setNewFolderName("");
      if (initialParentId) {
        setNewFolderType('subfolder');
        setNewFolderParentId(initialParentId);
      } else {
        setNewFolderType('folder');
        setNewFolderParentId(null);
      }
    }
  }, [isOpen, initialParentId]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({ variant: "destructive", title: "Folder Name Required" });
      return;
    }

    if (newFolderType === 'subfolder' && !newFolderParentId) {
      toast({ variant: "destructive", title: "Parent Folder Required" });
      return;
    }

    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      parentId: newFolderType === 'folder' ? null : newFolderParentId,
    };
    onFolderCreated(newFolder);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New</DialogTitle>
          <DialogDescription>
            Create a new top-level folder or a subfolder within an existing one.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <RadioGroup 
            value={newFolderType} 
            onValueChange={(value) => setNewFolderType(value as 'folder' | 'subfolder')} 
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="folder" id="r1" className="peer sr-only" />
              <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                Top-level Folder
              </Label>
            </div>
            <div>
              <RadioGroupItem value="subfolder" id="r2" className="peer sr-only" disabled={topLevelFolders.length === 0} />
              <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                Subfolder
              </Label>
            </div>
          </RadioGroup>

          {newFolderType === 'subfolder' && (
            <div className="space-y-2">
              <Label htmlFor="parent-folder">Parent Folder</Label>
              <Select value={newFolderParentId ?? undefined} onValueChange={setNewFolderParentId} disabled={topLevelFolders.length === 0}>
                <SelectTrigger id="parent-folder">
                  <SelectValue placeholder="Select a parent folder..." />
                </SelectTrigger>
                <SelectContent>
                  {folders.filter(f => !f.parentId).map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {topLevelFolders.length === 0 && (
                <p className="text-xs text-destructive">You must create a top-level folder before you can create a subfolder.</p>
              )}
            </div>
          )}

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
