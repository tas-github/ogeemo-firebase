
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type FileItem } from '@/data/files';
import { LoaderCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface FileEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  file: FileItem | null;
  initialContent: string | null;
}

export default function FileEditDialog({ isOpen, onOpenChange, file, initialContent }: FileEditDialogProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent !== null) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      // This is where you would call a server action to save the file content.
      // For now, we will simulate it.
      console.log(`Simulating save for ${file.name} with content:`, content);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "File Saved (Simulated)",
        description: `${file.name} has been updated.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit: {file?.name}</DialogTitle>
          <DialogDescription>
            Make changes to this text file. Changes will be saved to Firebase Storage.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            {initialContent === null ? (
              <div className="flex items-center justify-center h-full">
                <LoaderCircle className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-full w-full resize-none font-mono text-sm"
              />
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || initialContent === null}>
            {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
