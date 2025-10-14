
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Plus, FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getEditorFiles, deleteEditorFile, type EditorFile } from '@/services/text-editor-service';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function NotesManagerView() {
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fileToDelete, setFileToDelete] = useState<EditorFile | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const loadFiles = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedFiles = await getEditorFiles(user.uid);
      setFiles(fetchedFiles.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime()));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load notes', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleNewNote = () => {
    // In a real app with folders, you might prompt for a folder or use a default.
    // For now, we'll use a placeholder folderId.
    const folderId = "notes-folder-placeholder"; 
    router.push(`/doc-editor?folderId=${folderId}`);
  };

  const handleEditNote = (fileId: string) => {
    router.push(`/doc-editor?fileId=${fileId}`);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await deleteEditorFile(fileToDelete.id);
      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      toast({ title: 'Note Deleted', description: `"${fileToDelete.name}" has been deleted.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } finally {
      setFileToDelete(null);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 flex flex-col items-center h-full">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Notes Manager
          </h1>
          <p className="text-muted-foreground">
            Create, view, and manage your text notes.
          </p>
        </header>

        <Card className="w-full max-w-4xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Notes</CardTitle>
              <Button onClick={handleNewNote}>
                <Plus className="mr-2 h-4 w-4" /> New Note
              </Button>
            </div>
            <CardDescription>A list of all your saved documents.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <LoaderCircle className="h-8 w-8 animate-spin" />
              </div>
            ) : files.length > 0 ? (
              <div className="space-y-2">
                {files.map(file => (
                  <div key={file.id} className="flex items-center gap-2 p-3 rounded-md border bg-muted/50">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium cursor-pointer hover:underline" onClick={() => handleEditNote(file.id)}>{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last modified {formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditNote(file.id)}>
                          <Pencil className="mr-2 h-4 w-4" /> Open / Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => setFileToDelete(file)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-16 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4">No notes found.</p>
                <p className="text-sm">Click "New Note" to create your first one.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the note "{fileToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
