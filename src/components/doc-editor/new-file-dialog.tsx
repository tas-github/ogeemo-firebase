
'use client';

import React, { useState } from 'react';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, LoaderCircle, ChevronRight } from "lucide-react";
import { type FolderItem } from '@/data/files';
import { cn } from '@/lib/utils';

interface NewFileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  folders: FolderItem[];
  isLoading: boolean;
  onCreate: (folderId: string, fileName: string, content: string) => void;
}

export function NewFileDialog({
  isOpen,
  onOpenChange,
  folders,
  isLoading,
  onCreate,
}: NewFileDialogProps) {
  const [fileName, setFileName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleCreate = () => {
    if (selectedFolderId && fileName.trim()) {
      // Create the file with empty content initially.
      onCreate(selectedFolderId, fileName.trim(), '');
    }
  };

  const FolderTreeItem = ({ folder, allFolders, level = 0 }: { folder: FolderItem, allFolders: FolderItem[], level?: number }) => {
    const hasChildren = allFolders.some(f => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);

    return (
      <div style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md cursor-pointer",
            selectedFolderId === folder.id ? "bg-primary/20" : "hover:bg-accent"
          )}
          onClick={() => setSelectedFolderId(folder.id)}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')}
              onClick={(e) => {
                e.stopPropagation();
                setExpandedFolders(p => {
                  const newSet = new Set(p);
                  if (newSet.has(folder.id)) {
                    newSet.delete(folder.id);
                  } else {
                    newSet.add(folder.id);
                  }
                  return newSet;
                });
              }}
            />
          ) : <div className="w-4" />}
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-sm truncate">{folder.name}</span>
        </div>
        {isExpanded && allFolders.filter(f => f.parentId === folder.id).sort((a, b) => a.name.localeCompare(b.name)).map(child => (
          <FolderTreeItem key={child.id} folder={child} allFolders={allFolders} level={level + 1} />
        ))}
      </div>
    );
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <DialogDescription>
            Select a folder and provide a name for your new document.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Select a Folder <span className="text-destructive">*</span></Label>
            <ScrollArea className="h-40 w-full rounded-md border">
              <div className="p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <LoaderCircle className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  folders.filter(f => !f.parentId).map(folder => (
                    <FolderTreeItem key={folder.id} folder={folder} allFolders={folders} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file-name">Document Name <span className="text-destructive">*</span></Label>
            <Input
              id="file-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., My New Note.txt"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!selectedFolderId || !fileName.trim()}>
            Create Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
