
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus2, FolderOpen, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getFolders, type FolderItem, addTextFile } from '@/services/file-service';
import { NewFileDialog } from '@/components/doc-editor/new-file-dialog';

export default function DocEditorRedirectPage() {
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const loadFolders = useCallback(async () => {
    if (!user) return;
    setIsLoadingFolders(true);
    try {
      const fetchedFolders = await getFolders(user.uid);
      setFolders(fetchedFolders);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load folders', description: error.message });
    } finally {
      setIsLoadingFolders(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (isNewFileDialogOpen) {
      loadFolders();
    }
  }, [isNewFileDialogOpen, loadFolders]);

  const handleCreateFile = async (folderId: string, fileName: string, content: string) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
    }

    try {
        const newFile = await addTextFile(folderId, fileName, content);
        toast({ title: 'File Created', description: `"${newFile.name}" has been created.` });
        setIsNewFileDialogOpen(false);
        router.push(`/doc-editor/${newFile.id}`);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full">
          <header className="text-center mb-8">
              <h1 className="text-3xl font-bold font-headline text-primary">Text Editor</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                  Your dedicated space for creating and editing text documents.
              </p>
          </header>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
              <Card className="w-full max-w-sm">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <FolderOpen className="h-6 w-6 text-primary"/>
                          Open Existing File
                      </CardTitle>
                      <CardDescription>
                          Browse your File Cabinet to find and edit a document.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button asChild className="w-full">
                          <Link href="/files">
                              Go to File Cabinet
                          </Link>
                      </Button>
                  </CardContent>
              </Card>

              <div className="text-sm text-muted-foreground font-semibold">OR</div>

              <Card className="w-full max-w-sm">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <FilePlus2 className="h-6 w-6 text-primary"/>
                          Create a New File
                      </CardTitle>
                      <CardDescription>
                          Start with a blank document in the editor.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button onClick={() => setIsNewFileDialogOpen(true)} className="w-full" variant="outline">
                          Create New Document
                      </Button>
                  </CardContent>
              </Card>
          </div>
      </div>
      <NewFileDialog
        isOpen={isNewFileDialogOpen}
        onOpenChange={setIsNewFileDialogOpen}
        folders={folders}
        isLoading={isLoadingFolders}
        onCreate={handleCreateFile}
      />
    </>
  );
}
